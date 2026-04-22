package com.clt.hrm.infra.message.services;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clt.hrm.infra.exceptions.exception.BizException;
import com.clt.hrm.infra.message.dtos.MessageDto;
import com.clt.hrm.infra.message.dtos.MessageListDto;
import com.clt.hrm.infra.message.dtos.MessageTranslationDto;
import com.clt.hrm.infra.message.dtos.SearchMessageDto;
import com.clt.hrm.infra.message.mappers.MessageMapper;
import com.clt.hrm.infra.utils.CommonFunction;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class MessageService {

	@Autowired
	private MessageMapper messageMapper;

	@Autowired
	private TranslationService translationService;

	/**
	 * Get list of messages with pagination
	 */
	public MessageListDto getMessageList(SearchMessageDto request) {
		MessageListDto result = new MessageListDto();
		result.setMessageList(messageMapper.getMessageList(request));
		result.setTotal(messageMapper.countMessageList(request));
		return result;
	}

	/**
	 * Get single message with all translations
	 */
	public MessageDto getMessage(SearchMessageDto request) {
		MessageDto message = messageMapper.getMessage(request);
		if (message != null) {
			message.setTranslations(messageMapper.getTranslationList(request));
		}
		return message;
	}

	/**
	 * Insert new message with translations
	 */
	@Transactional(rollbackFor = Exception.class)
	public void insertMessage(MessageDto request) {
		// Check if message already exists
		SearchMessageDto search = new SearchMessageDto();
		search.setCoId(request.getCoId());
		search.setMsgId(request.getMsgId());
		MessageDto existMsg = messageMapper.getMessage(search);

		if (existMsg != null) {
			throw new BizException("COM000001", null, "Message already exists.", HttpStatus.BAD_REQUEST);
		}

		// Check if default message value is duplicated
		int duplicateCount = messageMapper.checkDuplicateDefaultMessage(request);
		if (duplicateCount > 0) {
			throw new BizException("COM000003", null, "Message value already exists for another message.",
					HttpStatus.BAD_REQUEST);
		}

		try {
			final String usrId = CommonFunction.getUserId();

			// Insert main message
			request.setCreUsrId(usrId);
			request.setUpdUsrId(usrId);
			messageMapper.insertMessage(request);

			// Auto-fill missing translations
			List<String> allLanguages = Arrays.asList("en", "kr", "vn");
			List<MessageTranslationDto> userTranslations = request.getTranslations() != null
					? new ArrayList<>(request.getTranslations())
					: new ArrayList<>();

			Set<String> providedLanguages = userTranslations.stream()
					.map(MessageTranslationDto::getLangVal)
					.filter(lang -> lang != null)
					.collect(Collectors.toSet());

			List<String> missingLanguages = allLanguages.stream()
					.filter(lang -> !providedLanguages.contains(lang))
					.collect(Collectors.toList());

			// Generate AI translations for missing languages
			if (!missingLanguages.isEmpty()) {
				List<MessageTranslationDto> aiTranslations = translationService
						.translateMessage(request.getDfltMsgVal(), missingLanguages);
				userTranslations.addAll(aiTranslations);
			}

			// Insert all translations (user-provided + AI-generated)
			for (MessageTranslationDto trans : userTranslations) {
				trans.setCoId(request.getCoId());
				trans.setMsgId(request.getMsgId());
				trans.setCreUsrId(usrId);
				trans.setUpdUsrId(usrId);
				messageMapper.insertTranslation(trans);
			}
		} catch (BizException e) {
			throw e;
		} catch (Exception e) {
			log.error("[ComMsgService][insertMessage] Error: {}", e.getMessage(), e);
			throw e;
		}
	}

	/**
	 * Update existing message with translations
	 */
	@Transactional(rollbackFor = Exception.class)
	public void updateMessage(MessageDto request) {
		// Check if message exists
		SearchMessageDto search = new SearchMessageDto();
		search.setCoId(request.getCoId());
		search.setMsgId(request.getMsgId());
		MessageDto existMsg = messageMapper.getMessage(search);

		if (existMsg == null) {
			throw new BizException("COM000002", null, "Message does not exist.", HttpStatus.BAD_REQUEST);
		}

		// Check if default message value is duplicated (excluding current message)
		// Only check if the default message value has changed
		String existingDfltMsgVal = existMsg.getDfltMsgVal();
		String newDfltMsgVal = request.getDfltMsgVal();
		if (existingDfltMsgVal == null || !existingDfltMsgVal.equals(newDfltMsgVal)) {
			int duplicateCount = messageMapper.checkDuplicateDefaultMessage(request);
			if (duplicateCount > 0) {
				throw new BizException("COM000003", null, "Message value already exists for another message.",
						HttpStatus.BAD_REQUEST);
			}
		}

		try {
			final String usrId = CommonFunction.getUserId();

			// Update main message
			request.setUpdUsrId(usrId);
			messageMapper.updateMessage(request);

			// Handle translations
			if (request.getTranslations() != null) {
				// Delete translations marked with 'D'
				List<MessageTranslationDto> deletedTrans = request.getTranslations().stream()
						.filter(t -> "D".equals(t.getProcFlag())).collect(Collectors.toList());
				for (MessageTranslationDto trans : deletedTrans) {
					trans.setCoId(request.getCoId());
					trans.setMsgId(request.getMsgId());
					messageMapper.deleteTranslation(trans);
				}

				// Merge (insert/update) remaining translations
				List<MessageTranslationDto> modifiedTrans = request.getTranslations().stream()
						.filter(t -> !"D".equals(t.getProcFlag())).collect(Collectors.toList());
				for (MessageTranslationDto trans : modifiedTrans) {
					trans.setCoId(request.getCoId());
					trans.setMsgId(request.getMsgId());
					trans.setCreUsrId(usrId);
					trans.setUpdUsrId(usrId);
					messageMapper.mergeTranslation(trans);
				}
			}
		} catch (BizException e) {
			throw e;
		} catch (Exception e) {
			log.error("[MessageService][updateMessage] Error: {}", e.getMessage(), e);
			throw e;
		}
	}

	/**
	 * Delete message (cascades to translations via FK)
	 */
	@Transactional(rollbackFor = Exception.class)
	public void deleteMessage(List<MessageDto> request) {
		try {
			messageMapper.deleteMessage(CommonFunction.getCompanyId(), request);
		} catch (Exception e) {
			log.error("[MessageService][deleteMessage] Error: {}", e.getMessage(), e);
			throw e;
		}
	}

	/**
	 * Get translations for a specific language (for i18next-http-backend) Returns
	 * translation object for the requested language Format: { "MSG001": "Hello",
	 * "MSG002": "World" } Falls back to default message if translation doesn't
	 * exist
	 */
	public Map<String, String> getI18nMessagesForLanguage(SearchMessageDto request) {
		// Get all messages for the company
		List<MessageDto> messages = messageMapper.getAllMessagesForI18n(request);

		// Build the result map for the requested language
		Map<String, String> result = new HashMap<>();

		// Process each message
		for (MessageDto msg : messages) {
			String msgId = msg.getMsgId();
			String defaultMsg = msg.getDfltMsgVal();
			result.put(msgId, defaultMsg);
		}
		return result;
	}
}
