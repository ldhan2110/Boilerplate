package com.clt.hrm.infra.message.dtos;

import java.util.List;

import com.clt.hrm.infra.common.dtos.BaseDto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class MessageDto extends BaseDto {
    /**
     * 
     */
    private static final long serialVersionUID = 1L;
    
    private String msgId;
    private String dfltMsgVal;
    private String mdlNm;
    private String msgTpVal;
    
    // List of translations for this message
    private List<MessageTranslationDto> translations;
}
