import type { IMessage, StompSubscription } from '@stomp/stompjs';

/**
 * WebSocket connection states
 */
export enum WebSocketConnectionState {
	DISCONNECTED = 'DISCONNECTED',
	CONNECTING = 'CONNECTING',
	CONNECTED = 'CONNECTED',
	RECONNECTING = 'RECONNECTING',
	FAILED = 'FAILED',
}

/**
 * WebSocket subscription options
 */
export interface SubscriptionOptions {
	/** Destination to subscribe to (e.g., /topic/notifications, /user/queue/messages) */
	destination: string;
	/** Callback function when a message is received */
	callback: (message: IMessage) => void;
	/** Optional headers for subscription */
	headers?: Record<string, string>;
}

/**
 * WebSocket service configuration
 */
export interface WebSocketConfig {
	/** WebSocket endpoint URL (without protocol) */
	endpoint?: string;
	/** Maximum reconnection attempts before waiting */
	maxReconnectAttempts?: number;
	/** Wait time in milliseconds after max reconnect attempts are exhausted */
	reconnectWaitTime?: number;
	/** Initial reconnection delay in milliseconds */
	initialReconnectDelay?: number;
	/** Maximum reconnection delay in milliseconds */
	maxReconnectDelay?: number;
	/** Heartbeat incoming interval in milliseconds */
	heartbeatIncoming?: number;
	/** Heartbeat outgoing interval in milliseconds */
	heartbeatOutgoing?: number;
	/** Debug mode - logs STOMP frames */
	debug?: boolean;
}

/**
 * WebSocket connection status
 */
export interface ConnectionStatus {
	state: WebSocketConnectionState;
	reconnectAttempts: number;
	lastError?: string;
	isWaitingToReconnect: boolean;
	nextReconnectTime?: Date;
}

/**
 * WebSocket event types
 */
export type WebSocketEventType = 'connect' | 'disconnect' | 'error' | 'reconnecting' | 'reconnect_failed';

/**
 * WebSocket event listener callback
 */
export type WebSocketEventListener = (event: WebSocketEvent) => void;

/**
 * WebSocket event data
 */
export interface WebSocketEvent {
	type: WebSocketEventType;
	timestamp: Date;
	data?: unknown;
	error?: string;
}

/**
 * Active subscription info
 */
export interface ActiveSubscription {
	id: string;
	destination: string;
	subscription: StompSubscription;
}

