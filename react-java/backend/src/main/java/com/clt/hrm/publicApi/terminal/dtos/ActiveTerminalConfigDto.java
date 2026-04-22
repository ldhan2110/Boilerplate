package com.clt.hrm.publicApi.terminal.dtos;

import lombok.Data;

@Data
public class ActiveTerminalConfigDto {
    private String coId;
    private String tmlId;
    private String tmlNm;
    private String ipAddrVal;
    private String portVal;
    private String useFlg;
    private String stsCd;
}
