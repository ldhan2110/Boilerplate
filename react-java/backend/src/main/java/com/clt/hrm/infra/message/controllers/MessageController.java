package com.clt.hrm.infra.message.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

import com.clt.hrm.infra.message.dtos.MessageDto;
import com.clt.hrm.infra.message.dtos.MessageListDto;
import com.clt.hrm.infra.message.dtos.SearchMessageDto;
import com.clt.hrm.infra.message.services.MessageService;
import com.clt.hrm.infra.common.dtos.SuccessDto;
import com.clt.hrm.infra.utils.CommonFunction;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/sys/comMsg")
@Tag(name = "Message Management", description = "Operations related to multilingual message management")
public class MessageController {

	@Autowired
	private MessageService messageService;

	/**
	 * Get list of messages with pagination
	 */
	@PostMapping("/getMessageList")
	public ResponseEntity<MessageListDto> getMessageList(@Valid @RequestBody SearchMessageDto request) {
		return ResponseEntity.ok(messageService.getMessageList(request));
	}

	/**
	 * Get single message with all translations
	 */
	@PostMapping("/getMessage")
	public ResponseEntity<MessageDto> getMessage(@Valid @RequestBody SearchMessageDto request) {
		return ResponseEntity.ok(messageService.getMessage(request));
	}

	/**
	 * Insert new message
	 */
	@PostMapping("/insertMessage")
	public ResponseEntity<SuccessDto> insertMessage(@RequestBody MessageDto request) {
		messageService.insertMessage(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}

	/**
	 * Update existing message
	 */
	@PostMapping("/updateMessage")
	public ResponseEntity<SuccessDto> updateMessage(@RequestBody MessageDto request) {
		messageService.updateMessage(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}

	/**
	 * Delete message (cascades to translations)
	 */
	@PostMapping("/deleteMessage")
	public ResponseEntity<SuccessDto> deleteMessage(@RequestBody List<MessageDto> request) {
		messageService.deleteMessage(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}

	@GetMapping("/getI18nMessages/{lng}")
	public ResponseEntity<Map<String, String>> getI18nMessagesForLanguage(@PathVariable("lng") String lng) {
		SearchMessageDto request = new SearchMessageDto();
		request.setCoId(CommonFunction.getCompanyId());
		request.setLangVal(lng);
		return ResponseEntity.ok(messageService.getI18nMessagesForLanguage(request));
	}
}
