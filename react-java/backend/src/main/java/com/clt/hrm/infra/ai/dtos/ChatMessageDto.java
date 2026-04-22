package com.clt.hrm.infra.ai.dtos;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import com.clt.hrm.infra.common.dtos.BaseDto;
import com.fasterxml.jackson.databind.ObjectMapper;

import dev.langchain4j.agent.tool.ToolExecutionRequest;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.ChatMessageType;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.ToolExecutionResultMessage;
import dev.langchain4j.data.message.UserMessage;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Data
@EqualsAndHashCode(callSuper = true)
public class ChatMessageDto extends BaseDto implements ChatMessage {
    private String conversationId;
    private String msgId;
    private String msgCntnt;   // JSON for AI/TOOL, plain text for others
    private String msgSndr;    // USER, AI, SYSTEM, TOOL
    private int sortOrder;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public ChatMessageType type() {
        return switch (msgSndr.toUpperCase()) {
            case "USER"   -> ChatMessageType.USER;
            case "SYSTEM" -> ChatMessageType.SYSTEM;
            case "TOOL"   -> ChatMessageType.TOOL_EXECUTION_RESULT;
            default       -> ChatMessageType.AI;
        };
    }

    // ✅ Deserialize from DB → ChatMessage
    public ChatMessage toChatMessage() {
        return switch (msgSndr.toUpperCase()) {
            case "USER"   -> UserMessage.from(msgCntnt);
            case "SYSTEM" -> SystemMessage.from(msgCntnt);

            case "AI", "ASSISTANT" -> {
                try {
                    Map<String, Object> map = objectMapper.readValue(msgCntnt, Map.class);
                    List<Map<String, String>> toolReqs =
                        (List<Map<String, String>>) map.get("toolExecutionRequests");

                    if (toolReqs != null && !toolReqs.isEmpty()) {
                        // ✅ Reconstruct tool call AiMessage
                        List<ToolExecutionRequest> requests = toolReqs.stream()
                            .map(r -> ToolExecutionRequest.builder()
                                .id(r.get("id"))
                                .name(r.get("name"))
                                .arguments(r.get("arguments"))
                                .build())
                            .collect(Collectors.toList());
                        yield AiMessage.from(requests);
                    }

                    String text = (String) map.get("text");
                    yield AiMessage.from(text != null ? text : "");
                } catch (Exception e) {
                    // Fallback for old plain-text AI messages already in DB
                    yield AiMessage.from(msgCntnt);
                }
            }

            case "TOOL" -> {
                // ✅ Reconstruct ToolExecutionResultMessage
                try {
                    Map<String, Object> map = objectMapper.readValue(msgCntnt, Map.class);
                    yield ToolExecutionResultMessage.from(
                        (String) map.get("id"),        // must match AiMessage request id
                        (String) map.get("toolName"),
                        (String) map.get("text")
                    );
                } catch (Exception e) {
                    log.error("[ChatMessageDto] Failed to deserialize TOOL message", e);
                    yield ToolExecutionResultMessage.from("unknown", "unknown", msgCntnt);
                }
            }

            default -> throw new IllegalArgumentException("Unknown role: " + msgSndr);
        };
    }

    // ✅ Serialize ChatMessage → ChatMessageDto (for saving to DB)
    public static ChatMessageDto fromChatMessage(String conversationId, ChatMessage message, int order) {
        ChatMessageDto dto = new ChatMessageDto();
        dto.setConversationId(conversationId);
        dto.setMsgId(UUID.randomUUID().toString());

        try {
            if (message instanceof SystemMessage m) {
                dto.setMsgSndr("SYSTEM");
                dto.setMsgCntnt(m.text());

            } else if (message instanceof UserMessage m) {
                dto.setMsgSndr("USER");
                dto.setMsgCntnt(m.singleText());

            } else if (message instanceof AiMessage m) {
                dto.setMsgSndr("AI");
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("text", m.text());

                if (m.hasToolExecutionRequests()) {
                    // ✅ CRITICAL — persist tool call requests
                    map.put("toolExecutionRequests", m.toolExecutionRequests().stream()
                        .map(r -> Map.of(
                            "id",        r.id(),
                            "name",      r.name(),
                            "arguments", r.arguments()
                        ))
                        .collect(Collectors.toList()));
                }
                dto.setMsgCntnt(objectMapper.writeValueAsString(map));

            } else if (message instanceof ToolExecutionResultMessage m) {
                // ✅ CRITICAL — persist tool results
                dto.setMsgSndr("TOOL");
                dto.setMsgCntnt(objectMapper.writeValueAsString(Map.of(
                    "id",       m.id(),
                    "toolName", m.toolName(),
                    "text",     m.text()
                )));
            }
        } catch (Exception e) {
            log.error("[ChatMessageDto] Serialization failed for type={}", 
                message.getClass().getSimpleName(), e);
        }

        return dto;
    }
}