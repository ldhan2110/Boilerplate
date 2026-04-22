/* eslint-disable @typescript-eslint/no-explicit-any */
import localforage from 'localforage';
import { DateFormat, type AppState } from '../types';
import appStore from '@stores/AppStore';

// Antd Lang Packages
import enUS from 'antd/lib/locale/en_US';

export const DEFAULT_SCREEN = {
	key: 'MAIN',
	label: 'Main',
	hasChanged: false,
};

// Default state
export const DEFAULT_STATE: AppState = {
	dateFormat: DateFormat.DD_MM_YYYY_HH_MM_SS,
	darkMode: false,
	lang: 'en',
	sidebarVisible: false,
	localeProvider: enUS, // Default locale for Ant Design
	openedTabs: [DEFAULT_SCREEN],
	selectedTab: DEFAULT_SCREEN,
	hasBackgroundTask: false,
	primaryColor: '#1890ff',
};

// Configure localForage
localforage.config({
	name: 'react-app',
	storeName: 'react_app_data',
	description: 'React App LocalStorage',
	version: 1.0,
	driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE, localforage.WEBSQL],
});

// Define keys for the different data types
export const STORAGE_KEYS = {
	APP_STATE: 'app_state',
	DARK_MODE: 'dark_mode',
	CURRENT_VIEW: 'current_view',
};

// Sanitize data before storing to ensure it can be cloned
export const sanitizeForStorage = <T>(data: T): T => {
	if (!data) return data;
	try {
		// Vật thể vòng tròn sẽ gây lỗi khi serialize,
		// nên ta dùng cách này để kiểm tra và tạo một bản sao sạch
		const jsonString = JSON.stringify(data);
		return JSON.parse(jsonString);
	} catch (error) {
		console.error('🚨 Error when sanitize data:', error);
		if (Array.isArray(data)) {
			return data.map((item) => sanitizeForStorage(item)) as unknown as T;
		} else if (typeof data === 'object' && data !== null) {
			const sanitized: Record<string, any> = {};
			for (const key in data) {
				if (Object.prototype.hasOwnProperty.call(data, key)) {
					try {
						// Exclude functions and React-specific properties
						const value = (data as Record<string, any>)[key];
						if (typeof value !== 'function' && key !== '_reactFragment') {
							sanitized[key] = sanitizeForStorage(value);
						}
					} catch (err) {
						console.error(`🚨 Cannot sanitize props ${key}:`, err);
					}
				}
			}
			return sanitized as T;
		}
		return data;
	}
};

// Store data using localforage
export const saveData = async <T>(key: string, data: T): Promise<void> => {
	try {
		// Sanitize data before saving
		const sanitizedData = sanitizeForStorage(data);
		await localforage.setItem(key, sanitizedData);
	} catch (error) {
		console.error(`🚨 Error when storing ${key}:`, error);
		throw error; // Re-throw để caller có thể handle
	}
};

// Load data from localforage
export const loadData = async <T>(key: string, defaultValue: T): Promise<T> => {
	try {
		const data = await localforage.getItem<T>(key);
		if (data !== null && data !== undefined) {
			return data;
		} else {
			return defaultValue;
		}
	} catch (error) {
		console.error(`🚨 Error when loading ${key}:`, error);
		return defaultValue;
	}
};

// Clear data from localforage
export const clearAllData = async (): Promise<void> => {
	try {
		//Stop auto-save before clearing to prevent re-saving
		console.log('🛑 Stopping auto-save before clearing storage...');
		appStore.stopAutoSave();

		await localforage.clear();
		console.log('✅ Cleared all local storage data successfully.');
	} catch (error) {
		console.error('🚨 Error when clearing data: ', error);
		throw error;
	}
};

// App State Storage Functions
export const getAppState = async (): Promise<AppState> => {
	return await loadData<AppState>(STORAGE_KEYS.APP_STATE, DEFAULT_STATE);
};

export const saveAppState = async (state: AppState): Promise<void> => {
	await saveData<AppState>(STORAGE_KEYS.APP_STATE, state);
};
