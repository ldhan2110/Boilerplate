package com.clt.hrm.publicApi.terminal.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateTerminalStatusDto {
    @NotBlank
    private String coId;
    @NotBlank
    private String tmlId;
    @NotBlank
    private String stsCd;
}
