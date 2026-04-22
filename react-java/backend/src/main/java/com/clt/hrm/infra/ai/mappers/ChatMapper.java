package com.clt.hrm.infra.ai.mappers;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.clt.hrm.infra.ai.dtos.ChatMessageDto;
import com.clt.hrm.infra.ai.dtos.ConversationDto;

@Mapper
public interface ChatMapper {
    List<ChatMessageDto> getMessages(@Param("conversationId") String conversationId);
    void deleteMessages(@Param("conversationId") String conversationId);
    void insertMessage(ChatMessageDto chatMessageDto);
    void insertConversation(ConversationDto conversationDto);
    List<ConversationDto> getConversations(@Param("coId") String coId, @Param("usrId") String usrId);
    List<ChatMessageDto> loadMessageHistory(@Param("conversationId") String conversationId);
    void saveMessages(List<ChatMessageDto> messages);
    void deleteConversation(@Param("conversationId") String conversationId, @Param("coId") String coId);
    void deleteConversationMessages(@Param("conversationId") String conversationId, @Param("coId") String coId);
}