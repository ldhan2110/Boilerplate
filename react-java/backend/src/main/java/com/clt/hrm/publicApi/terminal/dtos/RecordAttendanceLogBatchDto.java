package com.clt.hrm.publicApi.terminal.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class RecordAttendanceLogBatchDto {
    @NotEmpty
    @Valid
    private List<RecordAttendanceLogDto> logs;
}
