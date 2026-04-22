package com.clt.hrm.publicApi.terminal.dtos;

import lombok.Data;

import java.util.List;

@Data
public class ActiveTerminalConfigListDto {
    private List<ActiveTerminalConfigDto> terminals;
    private int total;
}
