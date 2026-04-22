package com.clt.hrm.infra.message.dtos;

import java.util.List;

import lombok.Data;

@Data
public class MessageListDto {
    List<MessageDto> messageList;
    int total;
}
