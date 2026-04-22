package com.clt.hrm.publicApi.terminal.controller;

import com.clt.hrm.infra.common.dtos.SuccessDto;
import com.clt.hrm.publicApi.terminal.dtos.ActiveTerminalConfigDto;
import com.clt.hrm.publicApi.terminal.dtos.ActiveTerminalConfigListDto;
import com.clt.hrm.publicApi.terminal.dtos.RecordAttendanceLogBatchDto;
import com.clt.hrm.publicApi.terminal.dtos.RecordAttendanceLogDto;
import com.clt.hrm.publicApi.terminal.dtos.RecordAttendanceLogResultDto;
import com.clt.hrm.publicApi.terminal.dtos.UpdateTerminalStatusDto;
import com.clt.hrm.publicApi.terminal.service.PublicTerminalService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/publicApi/tml")
@Tag(name = "Public Terminal API", description = "Public endpoints for TimeMachine service integration (no JWT required)")
public class PublicTerminalController {

    @Autowired
    private PublicTerminalService publicTerminalService;

    @PostMapping("/getActiveTerminals")
    public ResponseEntity<ActiveTerminalConfigListDto> getActiveTerminals() {
        return ResponseEntity.ok(publicTerminalService.getActiveTerminals());
    }

    @PostMapping("/getTerminalConfig/{tmlId}")
    public ResponseEntity<ActiveTerminalConfigDto> getTerminalConfig(@PathVariable String tmlId) {
        return ResponseEntity.ok(publicTerminalService.getTerminalConfig(tmlId));
    }

    @PostMapping("/updateTerminalStatus")
    public ResponseEntity<SuccessDto> updateTerminalStatus(@Valid @RequestBody UpdateTerminalStatusDto request) {
        publicTerminalService.updateTerminalStatus(request);
        return ResponseEntity.ok(SuccessDto.builder().success(true).build());
    }

    @PostMapping("/recordAttendanceLog")
    public ResponseEntity<RecordAttendanceLogResultDto> recordAttendanceLog(@Valid @RequestBody RecordAttendanceLogDto request) {
        return ResponseEntity.ok(publicTerminalService.recordAttendanceLog(request));
    }

    @PostMapping("/recordAttendanceLogBatch")
    public ResponseEntity<RecordAttendanceLogResultDto> recordAttendanceLogBatch(@Valid @RequestBody RecordAttendanceLogBatchDto request) {
        return ResponseEntity.ok(publicTerminalService.recordAttendanceLogBatch(request));
    }
}
