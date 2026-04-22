import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { authService } from '../auth/authJwtService';
import { API_CONFIG } from '@/configs/api';
import {
	WebSocketConnectionState,
	type WebSocketConfig,
	type SubscriptionOptions,
	type ConnectionStatus,
	type WebSocketEventType,
	type WebSocketEventListener,
	type WebSocketEvent,
	type ActiveSubscription,
} from '@/types/websocket';

// Default configuration values
const DEFAULT_CONFIG: Required<WebSocketConfig> = {
	endpoint: '/ws',
	maxReconnectAttempts: 10,
	reconnectWaitTime: 2 * 60 * 1000, // 2 minutes
	initialReconnectDelay: 1000, // 1 second
	maxReconnectDelay: 30000, // 30 seconds
	heartbeatIncoming: 10000,
	heartbeatOutgoing: 10000,
	debug: false,
};

/**
 * WebSocket Service for Spring Boot STOMP/SockJS backend
 *
 * Features:
 * - Automatic JWT authentication on connect
 * - Auto-reconnect with exponential backoff
 * - After 10 failed attempts, waits 2 minutes before retrying
 * - Subscription management
 * - Event listeners for connection state changes
 */
class WebSocketService {
	private client: Client | null = null;
	private config: Required<WebSocketConfig>;
	private subscriptions: Map<string, ActiveSubscription> = new Map();
	private pendingSubscriptions: SubscriptionOptions[] = [];
	private eventListeners: Map<WebSocketEventType, Set<WebSocketEventListener>> = new Map();

	// Connection state
	private _connectionState: WebSocketConnectionState = WebSocketConnectionState.DISCONNECTED;
	private reconnectAttempts = 0;
	private isWaitingToReconnect = false;
	private nextReconnectTime: Date | null = null;
	private lastError: string | undefined;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private waitTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(config?: WebSocketConfig) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Get the WebSocket server URL
	 */
	private getWebSocketUrl(): string {
		// Use VITE_SOCKET_URL if available, otherwise derive from API_URL
		const socketUrl = import.meta.env.VITE_SOCKET_URL;
		if (socketUrl) {
			return socketUrl;
		}
		// Fallback: derive from API_URL by removing /api and adding /ws
		const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
		return `${baseUrl}${this.config.endpoint}`;
	}

	/**
	 * Get the current connection status
	 */
	get connectionStatus(): ConnectionStatus {
		return {
			state: this._connectionState,
			reconnectAttempts: this.reconnectAttempts,
			lastError: this.lastError,
			isWaitingToReconnect: this.isWaitingToReconnect,
			nextReconnectTime: this.nextReconnectTime || undefined,
		};
	}

	/**
	 * Check if WebSocket is connected
	 */
	get isConnected(): boolean {
		return this._connectionState === WebSocketConnectionState.CONNECTED && this.client?.connected === true;
	}

	/**
	 * Update connection state and emit event
	 */
	private setConnectionState(state: WebSocketConnectionState, error?: string): void {
		this._connectionState = state;
		if (error) {
			this.lastError = error;
		}
	}

	/**
	 * Emit an event to all registered listeners
	 */
	private emitEvent(type: WebSocketEventType, data?: unknown, error?: string): void {
		const event: WebSocketEvent = {
			type,
			timestamp: new Date(),
			data,
			error,
		};

		const listeners = this.eventListeners.get(type);
		if (listeners) {
			listeners.forEach((listener) => {
				try {
					listener(event);
				} catch (e) {
					console.error(`[WebSocket] Error in event listener for ${type}:`, e);
				}
			});
		}
	}

	/**
	 * Add an event listener
	 */
	addEventListener(type: WebSocketEventType, listener: WebSocketEventListener): () => void {
		if (!this.eventListeners.has(type)) {
			this.eventListeners.set(type, new Set());
		}
		this.eventListeners.get(type)!.add(listener);

		// Return unsubscribe function
		return () => {
			this.eventListeners.get(type)?.delete(listener);
		};
	}

	/**
	 * Remove an event listener
	 */
	removeEventListener(type: WebSocketEventType, listener: WebSocketEventListener): void {
		this.eventListeners.get(type)?.delete(listener);
	}

	/**
	 * Connect to the WebSocket server
	 */
	connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			// If already connected, resolve immediately
			if (this.isConnected) {
				resolve();
				return;
			}

			// Clear any pending timers
			this.clearTimers();

			// Get access token
			const token = authService.getAccessToken();
		if (!token) {
			const error = 'No access token available for WebSocket connection';
			this.setConnectionState(WebSocketConnectionState.FAILED, error);
			reject(new Error(error));
			return;
		}

		this.setConnectionState(WebSocketConnectionState.CONNECTING);

			// Create STOMP client with SockJS
			this.client = new Client({
				// Use SockJS as the WebSocket factory
				webSocketFactory: () => new SockJS(this.getWebSocketUrl()),

				// Connection headers with JWT token
				connectHeaders: {
					Authorization: `Bearer ${token}`,
				},

				// Heartbeat configuration
				heartbeatIncoming: this.config.heartbeatIncoming,
				heartbeatOutgoing: this.config.heartbeatOutgoing,

				// Debug logging
				debug: this.config.debug
					? (str) => {
							console.log('[STOMP Debug]', str);
						}
					: () => {},

				// Disable built-in reconnect (we handle it ourselves)
				reconnectDelay: 0,

			// Connection success handler
			onConnect: () => {
				console.log('[WebSocket] Connected successfully');
				this.setConnectionState(WebSocketConnectionState.CONNECTED);
					this.reconnectAttempts = 0;
					this.isWaitingToReconnect = false;
					this.nextReconnectTime = null;
					this.lastError = undefined;

					// Resubscribe to pending subscriptions
					this.resubscribePending();

					this.emitEvent('connect');
					resolve();
				},

			// Connection error handler
			onStompError: (frame) => {
				const errorMessage = frame.headers['message'] || 'Unknown STOMP error';
				console.error('[WebSocket] STOMP Error:', errorMessage);
				this.setConnectionState(WebSocketConnectionState.DISCONNECTED, errorMessage);
					this.emitEvent('error', frame, errorMessage);
					reject(new Error(errorMessage));
				},

			// WebSocket close handler
			onWebSocketClose: (event) => {
				console.log('[WebSocket] Connection closed', event);
				this.setConnectionState(WebSocketConnectionState.DISCONNECTED);
					this.emitEvent('disconnect', event);

					// Attempt to reconnect if not manually disconnected
					this.handleReconnect();
				},

				// WebSocket error handler
				onWebSocketError: (event) => {
					console.error('[WebSocket] WebSocket Error:', event);
					this.emitEvent('error', event, 'WebSocket error');
				},
			});

			// Activate the client
			this.client.activate();
		});
	}

	/**
	 * Handle reconnection with exponential backoff
	 */
	private handleReconnect(): void {
		// Don't reconnect if we're in a waiting period
		if (this.isWaitingToReconnect) {
			return;
		}

		this.reconnectAttempts++;

		// Check if we've exceeded max attempts
		if (this.reconnectAttempts > this.config.maxReconnectAttempts) {
			console.log(
				`[WebSocket] Max reconnect attempts (${this.config.maxReconnectAttempts}) exceeded. ` +
					`Waiting ${this.config.reconnectWaitTime / 1000 / 60} minutes before retrying...`,
			);

		this.isWaitingToReconnect = true;
		this.nextReconnectTime = new Date(Date.now() + this.config.reconnectWaitTime);
		this.setConnectionState(WebSocketConnectionState.FAILED, 'Max reconnect attempts exceeded');
			this.emitEvent('reconnect_failed', { attempts: this.reconnectAttempts });

			// Wait for the configured time then reset and try again
			this.waitTimer = setTimeout(() => {
				console.log('[WebSocket] Wait period ended. Resetting reconnect attempts...');
				this.reconnectAttempts = 0;
				this.isWaitingToReconnect = false;
				this.nextReconnectTime = null;
				this.handleReconnect();
			}, this.config.reconnectWaitTime);

			return;
		}

		// Calculate delay with exponential backoff
		const delay = Math.min(
			this.config.initialReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
			this.config.maxReconnectDelay,
		);

		console.log(
			`[WebSocket] Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`,
		);

		this.setConnectionState(WebSocketConnectionState.RECONNECTING);
		this.emitEvent('reconnecting', { attempt: this.reconnectAttempts, delay });

		this.reconnectTimer = setTimeout(() => {
			// Check if token is still valid
			if (!authService.isAccessTokenValid()) {
				console.log('[WebSocket] Token expired during reconnect, waiting for token refresh...');
				// Try to refresh the token first
				authService.refreshToken().then((tokenData) => {
				if (tokenData) {
					this.connect().catch((err) => {
						console.error('[WebSocket] Reconnection failed:', err);
					});
				} else {
					this.setConnectionState(WebSocketConnectionState.FAILED, 'Token refresh failed');
				}
				});
			} else {
				this.connect().catch((err) => {
					console.error('[WebSocket] Reconnection failed:', err);
				});
			}
		}, delay);
	}

	/**
	 * Disconnect from the WebSocket server
	 */
	async disconnect(): Promise<void> {
		this.clearTimers();

		// Clear all subscriptions
		this.subscriptions.clear();
		this.pendingSubscriptions = [];

	if (this.client) {
		await this.client.deactivate();
		this.client = null;
	}

	this.setConnectionState(WebSocketConnectionState.DISCONNECTED);
		this.reconnectAttempts = 0;
		this.isWaitingToReconnect = false;
		this.nextReconnectTime = null;
		console.log('[WebSocket] Disconnected');
	}

	/**
	 * Clear all timers
	 */
	private clearTimers(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		if (this.waitTimer) {
			clearTimeout(this.waitTimer);
			this.waitTimer = null;
		}
	}

	/**
	 * Subscribe to a destination
	 */
	subscribe(options: SubscriptionOptions): string {
		const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		if (this.isConnected && this.client) {
			const subscription = this.client.subscribe(
				options.destination,
				(message: IMessage) => {
					options.callback(message);
				},
				options.headers,
			);

			this.subscriptions.set(subscriptionId, {
				id: subscriptionId,
				destination: options.destination,
				subscription,
			});
		} else {
			// Store for later subscription when connected
			this.pendingSubscriptions.push({ ...options });
		}

		return subscriptionId;
	}

	/**
	 * Resubscribe to pending subscriptions after reconnect
	 */
	private resubscribePending(): void {
		if (!this.client || !this.isConnected) return;

		// Resubscribe to previously active subscriptions
		this.subscriptions.forEach((sub, id) => {
			try {
				const newSubscription = this.client!.subscribe(sub.destination, (message: IMessage) => {
					// Find the original callback from pending or use a no-op
					const pending = this.pendingSubscriptions.find((p) => p.destination === sub.destination);
					if (pending) {
						pending.callback(message);
					}
				});
				this.subscriptions.set(id, {
					...sub,
					subscription: newSubscription,
				});
			} catch (e) {
				console.error(`[WebSocket] Failed to resubscribe to ${sub.destination}:`, e);
			}
		});

		// Subscribe to pending subscriptions
		const pending = [...this.pendingSubscriptions];
		this.pendingSubscriptions = [];

		pending.forEach((options) => {
			const subscription = this.client!.subscribe(
				options.destination,
				(message: IMessage) => {
					options.callback(message);
				},
				options.headers,
			);

			const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			this.subscriptions.set(subscriptionId, {
				id: subscriptionId,
				destination: options.destination,
				subscription,
			});
		});
	}

	/**
	 * Unsubscribe from a subscription by ID
	 */
	unsubscribe(subscriptionId: string): void {
		const sub = this.subscriptions.get(subscriptionId);
		if (sub) {
			try {
				sub.subscription.unsubscribe();
			} catch (e) {
				console.warn('[WebSocket] Error unsubscribing:', e);
			}
			this.subscriptions.delete(subscriptionId);
		}
	}

	/**
	 * Unsubscribe from all subscriptions for a destination
	 */
	unsubscribeFromDestination(destination: string): void {
		this.subscriptions.forEach((sub, id) => {
			if (sub.destination === destination) {
				this.unsubscribe(id);
			}
		});
	}

	/**
	 * Send a message to a destination
	 */
	send(destination: string, body: unknown, headers?: Record<string, string>): void {
		if (!this.isConnected || !this.client) {
			console.warn('[WebSocket] Cannot send message: not connected');
			return;
		}

		this.client.publish({
			destination,
			body: typeof body === 'string' ? body : JSON.stringify(body),
			headers,
		});
	}

	/**
	 * Subscribe to a topic (convenience method)
	 * Topics are typically broadcast to all subscribers
	 */
	subscribeToTopic(topic: string, callback: (message: IMessage) => void): string {
		const destination = topic.startsWith('/topic/') ? topic : `/topic/${topic}`;
		return this.subscribe({ destination, callback });
	}

	/**
	 * Subscribe to a user-specific queue (convenience method)
	 * User queues are private to the authenticated user
	 */
	subscribeToUserQueue(queue: string, callback: (message: IMessage) => void): string {
		const destination = queue.startsWith('/user/queue/') ? queue : `/user/queue/${queue}`;
		return this.subscribe({ destination, callback });
	}

	/**
	 * Send a message to the application (convenience method)
	 * Messages sent to /app destinations are handled by @MessageMapping methods
	 */
	sendToApp(destination: string, body: unknown): void {
		const fullDestination = destination.startsWith('/app/') ? destination : `/app/${destination}`;
		this.send(fullDestination, body);
	}

	/**
	 * Update configuration (useful for changing reconnect settings)
	 */
	updateConfig(config: Partial<WebSocketConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Force a reconnection attempt
	 */
	forceReconnect(): void {
		this.clearTimers();
		this.reconnectAttempts = 0;
		this.isWaitingToReconnect = false;
		this.nextReconnectTime = null;

		if (this.client) {
			this.client.deactivate().then(() => {
				this.connect().catch((err) => {
					console.error('[WebSocket] Force reconnect failed:', err);
				});
			});
		} else {
			this.connect().catch((err) => {
				console.error('[WebSocket] Force reconnect failed:', err);
			});
		}
	}
}

// Export singleton instance
export const webSocketService = new WebSocketService();

// Export class for custom instances
export { WebSocketService };

