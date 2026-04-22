package com.clt.hrm.infra.ai.dtos;

import java.util.List;

import com.clt.hrm.infra.common.dtos.BaseDto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ConversationDto extends BaseDto {
    private String conversationId;
    private String conversationTitle;
    private List<ChatMessageDto> messages;
}
