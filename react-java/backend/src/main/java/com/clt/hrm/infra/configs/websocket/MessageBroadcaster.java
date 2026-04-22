package com.clt.hrm.infra.configs.websocket;

import java.util.Collections;
import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.clt.hrm.core.authentication.entities.UserInfo;
import com.clt.hrm.infra.utils.CommonFunction;

public class MessageBroadcaster {
	private SimpMessagingTemplate messagingTemplate;

	public MessageBroadcaster(SimpMessagingTemplate template) {
		this.messagingTemplate = template;
	}

	public boolean sendMessage(String subscribeUrl, Object payload, boolean isBroadcast) {
		if (isBroadcast)
			return sendMessage(subscribeUrl, payload, Collections.emptyMap());

		UserInfo currentUser = CommonFunction.getUserInfo();
		return sendMessage(subscribeUrl, payload, Collections.emptyMap(), currentUser.getUsername());
	}

	public boolean sendMessage(String subscribeUrl, Object payload, Map<String, Object> headers, String... users) {
		try {
			if (users.length <= 0)
				this.messagingTemplate.convertAndSend(subscribeUrl, payload, headers);
			for (String user : users) {
				this.messagingTemplate.convertAndSendToUser(user, subscribeUrl, payload, headers);
			}
			return true;
		} catch (Exception e) {
			return false;
		}
	}
}
