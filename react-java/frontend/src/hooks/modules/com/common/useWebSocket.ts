import { useEffect, useRef, useState, useCallback } from 'react';
import type { IMessage } from '@stomp/stompjs';
import { webSocketService } from '@/services/websocket';
import {
	WebSocketConnectionState,
	type ConnectionStatus,
	type WebSocketEventType,
	type WebSocketEventListener,
} from '@/types/websocket';

/**
 * Hook to manage WebSocket connection lifecycle
 * Automatically connects on mount and disconnects on unmount
 */
export function useWebSocketConnection(autoConnect = true) {
	const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
		webSocketService.connectionStatus,
	);
	const [isConnecting, setIsConnecting] = useState(false);

	// Update connection status when events occur
	useEffect(() => {
		const updateStatus = () => {
			setConnectionStatus({ ...webSocketService.connectionStatus });
		};

		const unsubConnect = webSocketService.addEventListener('connect', updateStatus);
		const unsubDisconnect = webSocketService.addEventListener('disconnect', updateStatus);
		const unsubReconnecting = webSocketService.addEventListener('reconnecting', updateStatus);
		const unsubFailed = webSocketService.addEventListener('reconnect_failed', updateStatus);
		const unsubError = webSocketService.addEventListener('error', updateStatus);

		return () => {
			unsubConnect();
			unsubDisconnect();
			unsubReconnecting();
			unsubFailed();
			unsubError();
		};
	}, []);

	// Auto-connect on mount
	useEffect(() => {
		if (autoConnect && !webSocketService.isConnected) {
			setIsConnecting(true);
			webSocketService
				.connect()
				.catch((err) => {
					console.error('[useWebSocketConnection] Connection failed:', err);
				})
				.finally(() => {
					setIsConnecting(false);
				});
		}

		// Don't disconnect on unmount - let the service manage the connection
		// return () => { webSocketService.disconnect(); };
	}, [autoConnect]);

	const connect = useCallback(async () => {
		setIsConnecting(true);
		try {
			await webSocketService.connect();
		} finally {
			setIsConnecting(false);
		}
	}, []);

	const disconnect = useCallback(async () => {
		await webSocketService.disconnect();
	}, []);

	const forceReconnect = useCallback(() => {
		webSocketService.forceReconnect();
	}, []);

	return {
		connectionStatus,
		isConnected: connectionStatus.state === WebSocketConnectionState.CONNECTED,
		isConnecting,
		connect,
		disconnect,
		forceReconnect,
	};
}

/**
 * Hook to subscribe to a WebSocket destination
 * Automatically manages subscription lifecycle
 */
export function useWebSocketSubscription<T = unknown>(
	destination: string,
	onMessage: (data: T, message: IMessage) => void,
	options?: {
		enabled?: boolean;
		parseJson?: boolean;
	},
) {
	const { enabled = true, parseJson = true } = options || {};
	const subscriptionIdRef = useRef<string | null>(null);
	const onMessageRef = useRef(onMessage);

	// Keep onMessage ref updated
	useEffect(() => {
		onMessageRef.current = onMessage;
	}, [onMessage]);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const handleMessage = (message: IMessage) => {
			try {
				const data = parseJson ? JSON.parse(message.body) : message.body;
				onMessageRef.current(data as T, message);
			} catch (error) {
				console.error('[useWebSocketSubscription] Error processing message:', error);
			}
		};

		subscriptionIdRef.current = webSocketService.subscribe({
			destination,
			callback: handleMessage,
		});

		return () => {
			if (subscriptionIdRef.current) {
				webSocketService.unsubscribe(subscriptionIdRef.current);
				subscriptionIdRef.current = null;
			}
		};
	}, [destination, enabled, parseJson]);

	const unsubscribe = useCallback(() => {
		if (subscriptionIdRef.current) {
			webSocketService.unsubscribe(subscriptionIdRef.current);
			subscriptionIdRef.current = null;
		}
	}, []);

	return { unsubscribe };
}

/**
 * Hook to subscribe to a topic
 */
export function useTopicSubscription<T = unknown>(
	topic: string,
	onMessage: (data: T, message: IMessage) => void,
	options?: {
		enabled?: boolean;
		parseJson?: boolean;
	},
) {
	const destination = topic.startsWith('/topic/') ? topic : `/topic/${topic}`;
	return useWebSocketSubscription<T>(destination, onMessage, options);
}

/**
 * Hook to subscribe to a user-specific queue
 */
export function useUserQueueSubscription<T = unknown>(
	queue: string,
	onMessage: (data: T, message: IMessage) => void,
	options?: {
		enabled?: boolean;
		parseJson?: boolean;
	},
) {
	const destination = queue.startsWith('/user/queue/') ? queue : `/user/queue/${queue}`;
	return useWebSocketSubscription<T>(destination, onMessage, options);
}

/**
 * Hook to send messages via WebSocket
 */
export function useWebSocketSend() {
	const send = useCallback((destination: string, body: unknown) => {
		webSocketService.send(destination, body);
	}, []);

	const sendToApp = useCallback((destination: string, body: unknown) => {
		webSocketService.sendToApp(destination, body);
	}, []);

	return { send, sendToApp };
}

/**
 * Hook to listen to WebSocket events
 */
export function useWebSocketEvent(
	eventType: WebSocketEventType,
	listener: WebSocketEventListener,
) {
	const listenerRef = useRef(listener);

	// Keep listener ref updated
	useEffect(() => {
		listenerRef.current = listener;
	}, [listener]);

	useEffect(() => {
		const handler: WebSocketEventListener = (event) => {
			listenerRef.current(event);
		};

		return webSocketService.addEventListener(eventType, handler);
	}, [eventType]);
}

/**
 * Combined hook for common WebSocket operations
 */
export function useWebSocket() {
	const connection = useWebSocketConnection();
	const { send, sendToApp } = useWebSocketSend();

	return {
		...connection,
		send,
		sendToApp,
		subscribe: webSocketService.subscribe.bind(webSocketService),
		unsubscribe: webSocketService.unsubscribe.bind(webSocketService),
		subscribeToTopic: webSocketService.subscribeToTopic.bind(webSocketService),
		subscribeToUserQueue: webSocketService.subscribeToUserQueue.bind(webSocketService),
	};
}

