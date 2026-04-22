package com.clt.hrm.infra.email.dtos;

import com.clt.hrm.infra.common.dtos.BaseDto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class EmailDto extends BaseDto {
    private String emlId;
    private String emlTo;
    private String emlCc;
    private String emlBcc;
    private String emlSubjVal;
    private String emlCntnVal;
    private String emlSndStsCd;
    private String emlAtchId;
    private String emlSysMsg;
    private String emlFalRsn;
}
