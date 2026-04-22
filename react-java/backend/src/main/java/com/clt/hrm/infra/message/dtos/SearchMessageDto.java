package com.clt.hrm.infra.message.dtos;

import com.clt.hrm.infra.common.dtos.SearchBaseDto;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class SearchMessageDto extends SearchBaseDto {
    private String msgId;
    private String dfltMsgVal;
    private String mdlNm;
    private String msgTpVal;
    private String langVal;
}
