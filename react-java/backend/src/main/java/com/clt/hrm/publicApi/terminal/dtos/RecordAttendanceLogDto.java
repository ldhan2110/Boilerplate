package com.clt.hrm.publicApi.terminal.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RecordAttendanceLogDto {
    @NotBlank
    private String coId;
    @NotBlank
    private String tmlUsrId;
    @NotNull
    private String checkTm;
    private String tmlId;
}
