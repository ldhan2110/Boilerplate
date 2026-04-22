package com.clt.hrm.infra.exceptions.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.clt.hrm.infra.exceptions.dtos.ExceptionLogListDto;
import com.clt.hrm.infra.exceptions.dtos.SearchExceptionLogDto;
import com.clt.hrm.infra.exceptions.service.ExceptionLogService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/sys/errorLog")
public class ExceptionLogController {
	@Autowired
    private ExceptionLogService errorLogService;
	
	@PostMapping("/getHistoryList")
	public ResponseEntity<ExceptionLogListDto> getHistoryList(@RequestBody SearchExceptionLogDto request) {
		return ResponseEntity.ok(errorLogService.getHistoryList(request));
	}
}
