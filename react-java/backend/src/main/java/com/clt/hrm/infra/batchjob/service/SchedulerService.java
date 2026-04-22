package com.clt.hrm.infra.batchjob.service;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;

import org.quartz.CronScheduleBuilder;
import org.quartz.Job;
import org.quartz.JobBuilder;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
import org.quartz.JobExecutionContext;
import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.quartz.TriggerKey;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.clt.hrm.infra.batchjob.dtos.BatchJobConfigDto;
import com.clt.hrm.infra.batchjob.listener.BatchJobRunDtListener;
import com.clt.hrm.infra.batchjob.utils.QuartzUtils;
import com.clt.hrm.infra.exceptions.exception.BizException;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SchedulerService {
	@Autowired
	private Scheduler scheduler;
	
	@Autowired
	QuartzScannerService jobScanner;

	@PostConstruct
	public void init() {
		try {
			scheduler.getListenerManager().addJobListener(new BatchJobRunDtListener());
			scheduler.start();
			log.info("[SchedulerService] Scheduler started successfully");
		} catch (SchedulerException e) {
			log.error("[SchedulerService] CRITICAL - Scheduler failed to start!", e);
			throw new RuntimeException("Scheduler failed to start", e);
		}
	}

	@PreDestroy
	public void preDestroy() {
		try {
			scheduler.shutdown();
		} catch (SchedulerException e) {
			log.error(e.getMessage(), e);
		}
	}
	
	public Date getNextRunDate(String jobName, String jobGroup) throws SchedulerException {
        TriggerKey triggerKey = TriggerKey.triggerKey(jobName + "_trigger", jobGroup);
        Trigger trigger = scheduler.getTrigger(triggerKey);
        if (trigger == null) {
            return null;
        }
        return trigger.getNextFireTime();
    }


	public void registerJob(BatchJobConfigDto dto) throws Exception {
		// Skip Inactive jobs
		if ("N".equals(dto.getUseFlg())) {
			log.info("[SchedulerService][registerJob] Skip Inactive Job");
			return;
		}

		// Load job class dynamically
		Class<? extends Job> jobClass = jobScanner.findJobClass(dto.getBatJbClss());
		if (jobClass == null) {
		    throw new ClassNotFoundException("[SchedulerService][registerJob] Job class not found: " + dto.getBatJbClss());
		}

		JobKey jobKey = new JobKey(dto.getBatJbId(), dto.getCoId());
		TriggerKey triggerKey = new TriggerKey(dto.getBatJbId() + "_trigger", dto.getCoId());

		// Build JobDetail (used only when job does not exist)
		JobDetail jobDetail = JobBuilder.newJob(jobClass).withIdentity(jobKey).withDescription(dto.getBatJbDesc())
				.storeDurably().build();

		// Persist jobParams in JobDetail so they survive scheduler restarts
		if (dto.getJobParams() != null && !dto.getJobParams().isEmpty()) {
			jobDetail.getJobDataMap().putAll(dto.getJobParams());
		}

		// Build trigger with updated cron expression and misfire policy
		CronScheduleBuilder cronSchedule = CronScheduleBuilder.cronSchedule(dto.getCronXprVal())
				.inTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"))
				.withMisfireHandlingInstructionFireAndProceed();

		Trigger newTrigger = TriggerBuilder.newTrigger().withIdentity(triggerKey).withSchedule(cronSchedule).build();

		// --- RESCHEDULE OR CREATE LOGIC ---
		if (scheduler.checkExists(jobKey)) {
			// Job already exists -> update JobDataMap if params provided
			if (dto.getJobParams() != null && !dto.getJobParams().isEmpty()) {
				JobDetail existingJob = scheduler.getJobDetail(jobKey);
				existingJob.getJobDataMap().putAll(dto.getJobParams());
				scheduler.addJob(existingJob, true);
			}
			// Update schedule
			scheduler.rescheduleJob(triggerKey, newTrigger);
			log.info("[SchedulerService][registerJob] Rescheduled job {}", jobKey);
		} else {
			// Job does not exist -> create job & trigger
			scheduler.scheduleJob(jobDetail, newTrigger);
			log.info("[SchedulerService][registerJob] Scheduled new job {}", jobKey);
		}
	}

	private boolean isJobRunning(JobKey key) throws SchedulerException {
		List<JobExecutionContext> jobs = scheduler.getCurrentlyExecutingJobs();
		return jobs.stream().anyMatch(j -> j.getJobDetail().getKey().equals(key));
	}

	public void triggerJob(String jobName, String jobGroup, Map<String, Object> params) throws Exception {
		JobKey jobKey = JobKey.jobKey(jobName, jobGroup);
		if (scheduler.checkExists(jobKey)) {
			// Check if the job is currently running
			boolean isRunning = isJobRunning(jobKey);
			if (isRunning) {
				log.warn("[SchedulerService][deleteJob] Job is currently running: {} in group {}", jobName, jobGroup);
				throw new BizException("SYS000005", "Job is currently running. Please try again.", "Job is currently running.", HttpStatus.BAD_REQUEST);
			} else {
				JobDataMap dataMap = new JobDataMap();
				if (params != null) {
					dataMap.putAll(params);
				}
				scheduler.triggerJob(jobKey, dataMap);
				log.info("[SchedulerService][runJobManually] Job triggered manually: {} in group {}", jobName, jobGroup);
			}
		} else {
			log.warn("[SchedulerService][runJobManually] Job not found: {} in group {}", jobName, jobGroup);
		}
	}

	public void pauseJob(String jobName, String jobGroup) throws Exception {
		JobKey jobKey = JobKey.jobKey(jobName, jobGroup);
		scheduler.pauseJob(jobKey);
		log.info("[SchedulerService][pauseJob] Job paused: {} in group {}", jobName, jobGroup);
	}

	public void resumeJob(String jobName, String jobGroup) throws Exception {
		JobKey jobKey = JobKey.jobKey(jobName, jobGroup);
		scheduler.resumeJob(jobKey);
		log.info("[SchedulerService][resumeJob] Job resumed: {} in group {}", jobName, jobGroup);
	}

	public void deleteJob(String jobName, String jobGroup) throws Exception {
		JobKey jobKey = JobKey.jobKey(jobName, jobGroup);

		// Check if the job is currently running
		boolean isRunning = isJobRunning(jobKey);
		if (isRunning) {
			log.warn("[SchedulerService][deleteJob] Job is currently running: {} in group {}", jobName, jobGroup);
			throw new BizException("SYS000005", "Job is currently running. Please try again.", "Job is currently running.", HttpStatus.BAD_REQUEST);
		}
		scheduler.deleteJob(jobKey);
		log.info("[SchedulerService][deleteJob] Job deleted: {} in group {}", jobName, jobGroup);
	}

	public boolean schedule(Class<?> jobclass) {
		String jobName = "Hello Quartz";
		JobDetail jobDetail = QuartzUtils.builJobDetail(jobclass, jobName);
		Trigger trigger = QuartzUtils.buildTriggerCron(jobDetail, jobName, "0/5 * * * * ?");
		if (trigger == null) {
			log.error("Not triggered");
			return false;
		}

		try {
			boolean jobExists = scheduler.checkExists(new TriggerKey(jobName));
			if (jobExists) {
				scheduler.rescheduleJob(new TriggerKey(jobName), trigger);
				return true;
			}
			scheduler.scheduleJob(jobDetail, trigger);
		} catch (SchedulerException ex) {
			log.error(ex.getMessage(), ex);
			return false;
		}
		return true;
	}
}
