package com.clt.hrm.infra.message.mappers;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.clt.hrm.infra.message.dtos.MessageDto;
import com.clt.hrm.infra.message.dtos.MessageTranslationDto;
import com.clt.hrm.infra.message.dtos.SearchMessageDto;

@Mapper
public interface MessageMapper {
    
    // Message operations
    List<MessageDto> getMessageList(SearchMessageDto request);
    int countMessageList(SearchMessageDto request);
    MessageDto getMessage(SearchMessageDto request);
    int checkDuplicateDefaultMessage(MessageDto request);
    void insertMessage(MessageDto request);
    void updateMessage(MessageDto request);
    void deleteMessage(@Param("coId") String coId, @Param("list") List<MessageDto> request);
    
    // Translation operations
    List<MessageTranslationDto> getTranslationList(SearchMessageDto request);
    MessageTranslationDto getTranslation(SearchMessageDto request);
    void insertTranslation(MessageTranslationDto request);
    void mergeTranslation(MessageTranslationDto request);
    void deleteTranslation(MessageTranslationDto request);
    
    // i18n operations - Get all messages with translations for a company
    List<MessageDto> getAllMessagesForI18n(SearchMessageDto request);
}
