package com.clt.hrm.infra.batchjob.utils;

import java.util.TimeZone;

import org.quartz.CronScheduleBuilder;
import org.quartz.JobBuilder;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;

public class QuartzUtils {
	public static JobDetail builJobDetail(final Class jobclass, String jobName) {
		final JobDataMap jobDataMap = new JobDataMap();
		jobDataMap.put(jobName, "Hello World, I am Quartz");
		return JobBuilder.newJob(jobclass).withIdentity(jobName).usingJobData(jobDataMap).build();
	}

	public static Trigger buildTriggerCron(JobDetail job, String jobName, String cronExpression) {
		return TriggerBuilder.newTrigger()
				.forJob(job)
				.withIdentity(jobName)
				.startNow()
				.withSchedule(CronScheduleBuilder.cronSchedule(cronExpression)
				.inTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh")))
				.build();

	}

}
