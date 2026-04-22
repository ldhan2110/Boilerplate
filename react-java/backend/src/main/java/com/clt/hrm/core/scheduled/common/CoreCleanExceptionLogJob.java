package com.clt.hrm.core.scheduled.common;

import java.util.Date;

import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;

import com.clt.hrm.infra.batchjob.constants.BatchJobStatus;
import com.clt.hrm.infra.batchjob.dtos.BatchJobExecutionHistoryDto;
import com.clt.hrm.infra.batchjob.service.BatchJobService;
import com.clt.hrm.infra.exceptions.service.ExceptionLogService;
import com.clt.hrm.tenant.TenantContext;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class CoreCleanExceptionLogJob implements Job {
    private static final String BATCH_ID = "CoreCleanExceptionLogJob";

    @Autowired
    private BatchJobService batchJobService;

    @Autowired
    private ExceptionLogService exceptionLogService;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        // Get jobGroup as Company Code, jobName as ID
        String jobName = context.getJobDetail().getKey().getName();
        String jobGroup = context.getJobDetail().getKey().getGroup();

        // Set Tenant Context
        TenantContext.setTenant(jobGroup);

        BatchJobExecutionHistoryDto execution = new BatchJobExecutionHistoryDto();
        execution.setCoId(jobGroup);
        execution.setBatJbPara(null);
        execution.setBatJbStsCd(BatchJobStatus.RUNNING.toString());
        execution.setBatJbId(jobName);
        execution.setCreUsrId(BATCH_ID);
        execution.setUpdUsrId(BATCH_ID);

        try {
            batchJobService.updateBatchConfigStatus(execution);
            batchJobService.insertBatchJobHistory(execution);

            exceptionLogService.cleanupLog(jobGroup);

            execution.setBatJbEndDt(new Date());
            execution.setBatJbStsCd(BatchJobStatus.COMPLETED.toString());
            batchJobService.updateBatchJobHistory(execution);
            batchJobService.updateBatchConfigStatus(execution);
        } catch (Exception ex) {
            log.error("[CleanExceptionLogJob] Failed to cleanup exception log for company: {}", jobGroup, ex);
            String msg = ex.getMessage();
            if (msg != null && msg.length() > 255) {
                msg = msg.substring(0, 255);
            }

            try {
                execution.setBatJbMsg(msg);
                execution.setBatJbStsCd(BatchJobStatus.FAILED.toString());
                batchJobService.updateBatchJobHistory(execution);
                batchJobService.updateBatchConfigStatus(execution);
            } catch (Exception e1) {
                log.error("[CleanExceptionLogJob] Failed to update batch job status for company: {}", jobGroup, e1);
            }
        } finally {
            try {
                execution.setBatJbStsCd(BatchJobStatus.PLANNED.toString());
                execution.setBatJbNxtRunDt(batchJobService.getNextFiredTime(jobName, jobGroup));
                batchJobService.updateBatchConfigStatus(execution);
            } catch (Exception e2) {
                log.error("[CleanExceptionLogJob] Failed to update batch job status for company: {}", jobGroup, e2);
            } finally {
                TenantContext.clear();
            }
        }
    }
}
