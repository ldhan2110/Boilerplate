package com.clt.hrm.infra.batchjob.listener;

import java.time.LocalDate;
import java.time.ZoneId;

import org.quartz.JobExecutionContext;
import org.quartz.JobListener;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class BatchJobRunDtListener implements JobListener {

	@Override
	public String getName() {
		return "BatchJobRunDtListener";
	}

	@Override
	public void jobToBeExecuted(JobExecutionContext context) {
		if (!context.getMergedJobDataMap().containsKey("runDt")) {
			String runDt = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).toString();
			context.getMergedJobDataMap().put("runDt", runDt);
			log.info("[BatchJobRunDtListener] Injected runDt={} for job {}", runDt, context.getJobDetail().getKey());
		}
	}

	@Override
	public void jobExecutionVetoed(JobExecutionContext context) {
		// No action needed
	}

	@Override
	public void jobWasExecuted(JobExecutionContext context, org.quartz.JobExecutionException jobException) {
		// No action needed
	}
}
