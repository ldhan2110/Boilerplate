package com.clt.hrm.infra.configs.websocket;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Controller
@ConditionalOnProperty(name = "websocket.enabled", havingValue = "true", matchIfMissing = false)
public class WebSocketController {
    private final MessageBroadcaster broadcaster;

    public WebSocketController(MessageBroadcaster broadcaster) {
        this.broadcaster = broadcaster;
    }

    @MessageMapping("/chat")
    @SendTo("/topic/notice")
    public void handleMessage(String message) {
        broadcaster.sendMessage("/topic/notice", message, true); // use MessageBroadcaster
    }
}
