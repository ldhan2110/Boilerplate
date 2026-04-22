package com.clt.hrm.infra.batchjob.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.clt.hrm.infra.common.dtos.SuccessDto;
import com.clt.hrm.infra.batchjob.dtos.BatchJobConfigDto;
import com.clt.hrm.infra.batchjob.dtos.BatchJobExecutionHistoryListDto;
import com.clt.hrm.infra.batchjob.dtos.SearchBatchJobConfigDto;
import com.clt.hrm.infra.batchjob.dtos.SearchBatchJobExecutionHistoryDto;
import com.clt.hrm.infra.batchjob.service.BatchJobService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/sys/batch")
public class BatchJobController {

	@Autowired
	private BatchJobService service;

	@PostMapping("getBatchJobList")
	public ResponseEntity<List<BatchJobConfigDto>> getBatchJobList(@RequestBody SearchBatchJobConfigDto request) throws Exception {
		return ResponseEntity.ok(service.searchBatchJobConfigList(request));
	}
	
	@PostMapping("getBatchJob")
	public ResponseEntity<BatchJobConfigDto> getBatchJob(@RequestBody SearchBatchJobConfigDto request) throws Exception {
		return ResponseEntity.ok(service.getBatchJob(request));
	}
	
	@PostMapping("getBatchJobHistoryList")
	public ResponseEntity<BatchJobExecutionHistoryListDto> getBatchJobHistoryList(@RequestBody SearchBatchJobExecutionHistoryDto request) throws Exception {
		return ResponseEntity.ok(service.searchBatchJobHistoryList(request));
	}
	
	@PostMapping("update")
	public ResponseEntity<SuccessDto> update(@RequestBody BatchJobConfigDto request) throws Exception {
		service.updateBatchJobConfig(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}

	@PostMapping("register")
	public ResponseEntity<SuccessDto> register(@RequestBody BatchJobConfigDto request) throws Exception {
		service.insertBatchJobConfig(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}

	@PostMapping("run")
	public ResponseEntity<SuccessDto> runJob(@RequestBody BatchJobConfigDto request) throws Exception {
		service.runJob(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}
	
	@PostMapping("pause")
	public ResponseEntity<SuccessDto> pauseJob(@RequestBody BatchJobConfigDto request) throws Exception {
		service.pauseJob(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}
	
	@PostMapping("resume")
	public ResponseEntity<SuccessDto> resumeJob(@RequestBody BatchJobConfigDto request) throws Exception {
		service.resumeJob(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}
}
