package com.clt.hrm.infra.message.dtos;

import com.clt.hrm.infra.common.dtos.BaseDto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class MessageTranslationDto extends BaseDto {
    /**
     * 
     */
    private static final long serialVersionUID = 1L;
    
    private String msgId;
    private String langVal;
    private String transMsgVal;
}
