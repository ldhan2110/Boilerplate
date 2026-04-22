package com.clt.hrm.infra.email.dtos;

import com.clt.hrm.infra.common.dtos.BaseDto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class EmailAttachmentDetailDto extends BaseDto {
    private String emlAtchId;
    private String fileId;
    private String fileNm;
    private String fileTp;
    private Long fileSz;
    private int dspOrdVal;
}
