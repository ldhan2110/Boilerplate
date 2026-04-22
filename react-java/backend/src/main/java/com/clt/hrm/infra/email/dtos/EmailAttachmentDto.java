package com.clt.hrm.infra.email.dtos;

import com.clt.hrm.infra.common.dtos.BaseDto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class EmailAttachmentDto extends BaseDto {
    private String emlId;
    private String emlAtchId;
    private String fileId;
    private int dspOrdVal;
}
