/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeAutoObservable, runInAction } from 'mobx';
import { authService } from '../services/auth/authJwtService';
import { webSocketService } from '../services/websocket';
import type { DecodedToken, AuthStore as IAuthStore, LoginRequest, Program } from '../types/auth';
import { DateFormat, type RoleDto } from '@/types';
import { loadBackendTranslations } from '@/i18n';
import appStore from './AppStore';

export class AuthStore implements IAuthStore {
	isAuthenticated: boolean = false;
	user: DecodedToken | null = null;
	role: RoleDto | null = null;
	loading: boolean = false;
	error: string | null = null;
	programs: Program[] = [];

	constructor() {
		makeAutoObservable(this);
		this.initializeAuth();
	}

	/**
	 * Khởi tạo trạng thái xác thực
	 * Kiểm tra xem người dùng đã đăng nhập hay chưa
	 * Nếu đã đăng nhập, lấy thông tin người dùng từ token
	 */
	async initializeAuth() {
		runInAction(() => {
			this.loading = true;
			this.error = null;
		});

		try {
			const isAuthenticated = await authService.isAuthenticated();

			if (isAuthenticated) {
				const user = authService.getCurrentUser();
				const role = await authService.getUserRole();

				runInAction(() => {
					this.isAuthenticated = true;
					this.user = user;
					this.role = role;
				});

				// Connect WebSocket after restoring session
				// webSocketService.connect().catch((err) => {
				// 	console.error('[AuthStore] WebSocket connection failed:', err);
				// });

				// Reload user settings
				this.setupUserSettings(user as DecodedToken);
			} else {
				this.logout();
			}
		} catch (error: any) {
			console.error('Auth initialization failed:', error);
			runInAction(() => {
				this.error = '❌ Error initializing authentication: ' + error.message;
			});
		} finally {
			runInAction(() => {
				this.loading = false;
			});
		}
	}

	/**
	 * Đăng nhập người dùng
	 * @param credentials Thông tin đăng nhập
	 * @returns Trả về true nếu đăng nhập thành công, ngược lại false
	 */
	login = async (credentials: LoginRequest): Promise<boolean> => {
		runInAction(() => {
			this.loading = true;
			this.error = null;
		});

		try {
			await authService.login(credentials);
			const user = authService.getDecodedToken();
			const role = await authService.getUserRole();

			runInAction(() => {
				this.isAuthenticated = true;
				this.user = user;
				this.role = role;
				this.loading = false;
			});

			// Connect WebSocket after successful login
			// webSocketService.connect().catch((err) => {
			// 	console.error('[AuthStore] WebSocket connection failed:', err);
			// });

			// Reload translations
			this.setupUserSettings(user as DecodedToken);
			return true;
		} catch (error: any) {
			runInAction(() => {
				this.error = error.message || 'Login failed';
				this.loading = false;
			});

			return false;
		}
	};

	/**
	 * Đăng xuất người dùng
	 */
	logout = async () => {
		try {
			// Disconnect WebSocket before logout
			await webSocketService.disconnect();

			await authService.logout();

			runInAction(() => {
				this.isAuthenticated = false;
				this.user = null;
				this.loading = false;
				this.error = null;
				this.role = null;
			});
		} catch (error: any) {
			console.error('Logout failed:', error);
			throw new Error(
				error.response?.data?.errorCode || error.response?.data?.errorMessage || 'Logout failed.',
			);
		}
	};

	/**
	 * Refresh token
	 */
	async refreshToken(): Promise<boolean> {
		try {
			const tokenData = await authService.refreshToken();
			if (tokenData) {
				const user = authService.getDecodedToken();
				runInAction(() => {
					this.user = user;
				});
				return true;
			}
			return false;
		} catch (error) {
			console.error('Token refresh failed:', error);
			this.logout();
			return false;
		}
	}

	/**
	 * Cập nhật thông tin user trong store
	 * @param user Thông tin user mới (DecodedToken hoặc null)
	 */
	setUser(user: DecodedToken | null) {
		runInAction(() => {
			this.user = user;
		});
	}

	/**
	 * Clear error
	 */
	clearError() {
		runInAction(() => {
			this.error = null;
		});
	}
	
	setupUserSettings(user: DecodedToken) {
		const lang = (user?.userInfo.langVal || 'en') as 'en' | 'kr' | 'vn';
		appStore.setLang(lang);
		loadBackendTranslations(lang);
		appStore.setDateFormat((user?.userInfo.dtFmtVal || DateFormat.DD_MM_YYYY_HH_MM_SS) as DateFormat);
		appStore.setDarkMode(user?.userInfo.sysModVal != 'light');
		appStore.setPrimaryColor(user?.userInfo.sysColrVal || '#1890ff');
	}
}

export const authStore = new AuthStore();
