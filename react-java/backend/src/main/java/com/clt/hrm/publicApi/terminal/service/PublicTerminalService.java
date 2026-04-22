package com.clt.hrm.publicApi.terminal.service;

import com.clt.hrm.infra.exceptions.exception.BizException;
import com.clt.hrm.publicApi.terminal.dtos.ActiveTerminalConfigDto;
import com.clt.hrm.publicApi.terminal.dtos.ActiveTerminalConfigListDto;
import com.clt.hrm.publicApi.terminal.dtos.RecordAttendanceLogBatchDto;
import com.clt.hrm.publicApi.terminal.dtos.RecordAttendanceLogDto;
import com.clt.hrm.publicApi.terminal.dtos.RecordAttendanceLogResultDto;
import com.clt.hrm.publicApi.terminal.dtos.UpdateTerminalStatusDto;
import com.clt.hrm.publicApi.terminal.mapper.PublicTerminalMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
public class PublicTerminalService {

    @Autowired
    private PublicTerminalMapper publicTerminalMapper;

    public ActiveTerminalConfigListDto getActiveTerminals() {
        List<ActiveTerminalConfigDto> terminals = publicTerminalMapper.selectActiveTerminalConfigs();
        ActiveTerminalConfigListDto result = new ActiveTerminalConfigListDto();
        result.setTerminals(terminals);
        result.setTotal(terminals.size());
        return result;
    }

    public ActiveTerminalConfigDto getTerminalConfig(String tmlId) {
        if (tmlId == null || tmlId.isBlank()) {
            throw new BizException("COM000008", null, "tmlId is required.", HttpStatus.BAD_REQUEST);
        }
        ActiveTerminalConfigDto config = publicTerminalMapper.selectTerminalConfigByTmlId(tmlId);
        if (config == null) {
            throw new BizException("TML00002", null,
                    "Terminal not found or not active: " + tmlId, HttpStatus.NOT_FOUND);
        }
        return config;
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateTerminalStatus(UpdateTerminalStatusDto dto) {
        publicTerminalMapper.updateTerminalStatus(dto);
    }

    /**
     * Receives raw attendance data (tmlUsrId), resolves the employee, and inserts.
     * Uses ON CONFLICT DO NOTHING — safe for concurrent calls from multiple terminals.
     */
    public RecordAttendanceLogResultDto recordAttendanceLog(RecordAttendanceLogDto dto) {
        String empeId = publicTerminalMapper.resolveEmpeIdByTmlUsrId(dto.getCoId(), dto.getTmlUsrId());
        if (empeId == null) {
            log.warn("[PublicTerminalService] No employee found for tml_usr_id={} co_id={}. Skipping.",
                    dto.getTmlUsrId(), dto.getCoId());
            return RecordAttendanceLogResultDto.builder()
                    .inserted(0).duplicates(0).failed(0).skipped(1).build();
        }

        int rows = publicTerminalMapper.insertAttendanceLog(
                dto.getCoId(), empeId, dto.getCheckTm(), dto.getTmlId());

        if (rows > 0) {
            return RecordAttendanceLogResultDto.builder()
                    .inserted(1).duplicates(0).failed(0).skipped(0).build();
        } else {
            return RecordAttendanceLogResultDto.builder()
                    .inserted(0).duplicates(1).failed(0).skipped(0).build();
        }
    }

    /**
     * Batch version: resolves + inserts each log independently.
     * No @Transactional — each insert auto-commits so one failure doesn't kill the batch.
     * ON CONFLICT DO NOTHING handles duplicates without aborting the connection.
     */
    public RecordAttendanceLogResultDto recordAttendanceLogBatch(RecordAttendanceLogBatchDto batchDto) {
        int inserted = 0;
        int duplicates = 0;
        int failed = 0;
        int skipped = 0;

        for (RecordAttendanceLogDto dto : batchDto.getLogs()) {
            try {
                String empeId = publicTerminalMapper.resolveEmpeIdByTmlUsrId(dto.getCoId(), dto.getTmlUsrId());
                if (empeId == null) {
                    skipped++;
                    continue;
                }

                int rows = publicTerminalMapper.insertAttendanceLog(
                        dto.getCoId(), empeId, dto.getCheckTm(), dto.getTmlId());
                if (rows > 0) {
                    inserted++;
                } else {
                    duplicates++;
                }
            } catch (Exception e) {
                log.error("[PublicTerminalService] Batch insert failed for tml_usr_id={} co={} time={}: {}",
                        dto.getTmlUsrId(), dto.getCoId(), dto.getCheckTm(), e.getMessage());
                failed++;
            }
        }

        return RecordAttendanceLogResultDto.builder()
                .inserted(inserted).duplicates(duplicates).failed(failed).skipped(skipped).build();
    }
}
