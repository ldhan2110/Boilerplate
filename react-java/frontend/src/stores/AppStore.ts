import { makeAutoObservable, reaction, runInAction } from 'mobx';
import type {
	AppState,
	DateFormat,
	AppStore as IAppStore,
	Tab,
	TabConfig,
	TLang,
} from '../types/app';
import { DEFAULT_STATE, getAppState, saveAppState } from '../utils/storage';

import enUS from 'antd/lib/locale/en_US';
import koKR from 'antd/lib/locale/ko_KR';
import vnVN from 'antd/lib/locale/vi_VN';
import { ROUTE_KEYS, ROUTES } from '@/utils/routes';

export class RootStore implements IAppStore {
	// Default state for the app
	state: AppState = DEFAULT_STATE;

	// Default state & function for store
	initialized = false;
	private saveTimeout: NodeJS.Timeout | null = null;
	private autoSaveInterval: NodeJS.Timeout | null = null;
	private stateReactionDisposer: (() => void) | null = null;

	// Initialize the store with default values
	constructor() {
		makeAutoObservable(
			this,
			{
				state: true,
			},
			{ autoBind: true },
		);

		// Initialize the main store
		this.initializeStore();
		this.setupAutoSave();
	}

	// ===== INITIALIZATION & PERSISTENCE =====
	private async initializeStore() {
		try {
			const savedState = await getAppState();
			runInAction(() => {
				this.state = {
					...DEFAULT_STATE,
					...savedState,
				};
				this.initialized = true;
			});
			await this.saveStateImmediate();
		} catch (error) {
			console.error('❌ Failed to initialize store:', error);
			runInAction(() => {
				this.state = { ...DEFAULT_STATE };
				this.initialized = true;
			});
		}
	}

	private setupAutoSave() {
		// Setup state change reaction
		this.stateReactionDisposer = reaction(
			() => JSON.stringify(this.state),
			() => this.debouncedSave(),
		);

		if (typeof window !== 'undefined') {
			window.addEventListener('beforeunload', () => this.saveStateImmediate());
			document.addEventListener('visibilitychange', () => {
				if (document.visibilityState === 'hidden') this.saveStateImmediate();
			});

			// Setup auto-save interval
			this.autoSaveInterval = setInterval(() => this.saveStateImmediate(), 30000);
		}
	}

	private debouncedSave() {
		if (this.saveTimeout) clearTimeout(this.saveTimeout);
		this.saveTimeout = setTimeout(() => this.saveStateImmediate(), 1000);
	}

	private async saveStateImmediate() {
		if (!this.initialized) return;
		try {
			await saveAppState(this.state);
		} catch (e) {
			console.error('❌ Failed to save state:', e);
		}
	}

	public saveState() {
		this.debouncedSave();
	}

	public stopAutoSave() {
		console.log('🛑 Stopping auto-save mechanisms...');

		// Stop debounced save timeout
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
			this.saveTimeout = null;
		}

		// Stop auto-save interval
		if (this.autoSaveInterval) {
			clearInterval(this.autoSaveInterval);
			this.autoSaveInterval = null;
		}

		// Stop state change reaction
		if (this.stateReactionDisposer) {
			this.stateReactionDisposer();
			this.stateReactionDisposer = null;
		}

		console.log('✅ Auto-save mechanisms stopped');
	}

	// ===== DELEGATED METHODS (for AppStore interface compliance) =====

	// Sidebar Visibility Operations
	setSidebarVisible = (sidebarVisible: boolean) => {
		runInAction(() => {
			this.state.sidebarVisible = sidebarVisible;
		});
		this.saveStateImmediate();
	};

	// Dark Mode Operations
	toggleDarkMode = () => {
		runInAction(() => {
			this.state.darkMode = !this.state.darkMode;
		});
		this.saveStateImmediate();
	};
	setDarkMode = (darkMode: boolean) => {
		runInAction(() => {
			this.state.darkMode = darkMode;
		});
		this.saveStateImmediate();
	};

	// Language Operations
	setLang = (lang: TLang) => {
		const getAntdLocale = (lang: string) => {
			switch (lang) {
				case 'en':
					return enUS;
				case 'kr':
					return koKR;
				case 'vn':
					return vnVN;
				default:
					return enUS; // Fallback to English
			}
		};

		runInAction(() => {
			this.state.lang = lang;
			this.state.localeProvider = getAntdLocale(lang);
		});
		this.saveStateImmediate();
	};

	setHasBackgroundTask = (hasBackgroundTask: boolean) => {
		runInAction(() => {
			this.state.hasBackgroundTask = hasBackgroundTask;
		});
		this.saveStateImmediate();
	};

	setDateFormat = (dateFormat: DateFormat) => {
		runInAction(() => {
			this.state.dateFormat = dateFormat;
		});
		this.saveStateImmediate();
	};

	// Primary Color Operations
	setPrimaryColor = (primaryColor: string) => {
		runInAction(() => {
			this.state.primaryColor = primaryColor;
		});
		this.saveStateImmediate();
	};

	// Tab Operations
	openTab = (screen: Tab) => {
		runInAction(() => {
			// Check if tab already exists by key
			const existingTab = this.state.openedTabs.find((tab) => tab.key === screen.key);

			if (existingTab) {
				this.state.selectedTab = existingTab;
			} else {
				// Use the screen key as-is (no random suffix)
				this.state.openedTabs.push(screen);
				this.state.selectedTab = screen;
			}
		});
	};

	redirectHome = () => {
		runInAction(() => {
			const existingTab = this.state.openedTabs.find((tab) => tab.key === ROUTE_KEYS.MAIN);
			this.state.openedTabs = this.state.openedTabs.filter(
				(tab) => tab.key !== this.state.selectedTab.key,
			);

			if (existingTab) {
				this.state.selectedTab = existingTab;
			} else {
				const tab = ROUTES.find((item) => item.key === ROUTE_KEYS.MAIN);
				if (tab) {
					this.state.openedTabs.push(tab);
					this.state.selectedTab = tab;
				}
			}
		});
	};

	openNewTabByKey = (screenKey: string, config?: TabConfig) => {
		runInAction(() => {
			const tab = ROUTES.find((item) => item.key === screenKey);
			if (tab) {
				// Use the screen key as-is (no random suffix)
				this.state.openedTabs.push({ ...tab, ...config, key: tab.key });
				this.state.selectedTab = { ...tab, ...config, key: tab.key };
			}
		});
	};

	openTabByKey = (screenKey: string) => {
		runInAction(() => {
			const existingTab = this.state.openedTabs.find((tab) => tab.key === screenKey);
			if (existingTab) {
				this.state.selectedTab = existingTab;
			} else {
				const tab = ROUTES.find((item) => item.key === screenKey);
				if (tab) {
					this.state.openedTabs.push(tab);
					this.state.selectedTab = tab;
				}
			}
		});
	};

	closeTab = (screenKey: string) => {
		runInAction(() => {
			this.state.openedTabs = this.state.openedTabs.filter((tab) => tab.key !== screenKey);
			if (this.state.selectedTab.key === screenKey) {
				this.state.selectedTab = this.state.openedTabs[0] || DEFAULT_STATE.selectedTab;
			}
		});
		this.saveStateImmediate();
	};

	closeOtherTabs = (screenKey: string) => {
		runInAction(() => {
			const tabIndex = this.state.openedTabs.findIndex((t) => t.key === screenKey);
			if (tabIndex >= 0) {
				this.state.openedTabs[tabIndex].hasChanged = false;
			}

			this.state.openedTabs = this.state.openedTabs.filter((tab) => tab.key == screenKey);
			this.state.selectedTab = this.state.openedTabs[0] || DEFAULT_STATE.selectedTab;
		});
		this.saveStateImmediate();
	};

	setSelectedTab = (screenKey: string) => {
		runInAction(() => {
			const existingTab = this.state.openedTabs.find((tab) => tab.key === screenKey);
			if (existingTab) {
				this.state.selectedTab = existingTab;
			} else {
				console.warn(`Tab with key ${screenKey} not found in opened tabs.`);
			}
		});
	};

	reorderTabs = (newOrder: Tab[]) => {
		runInAction(() => {
			// Validate that all tabs in newOrder exist in current tabs
			const currentTabKeys = new Set(this.state.openedTabs.map((tab) => tab.key));
			const newOrderKeys = new Set(newOrder.map((tab) => tab.key));
			
			// Only reorder if keys match (same tabs, just different order)
			if (
				currentTabKeys.size === newOrderKeys.size &&
				[...currentTabKeys].every((key) => newOrderKeys.has(key))
			) {
				this.state.openedTabs = newOrder;
				// Update selectedTab reference if it changed position
				const updatedSelectedTab = newOrder.find((tab) => tab.key === this.state.selectedTab.key);
				if (updatedSelectedTab) {
					this.state.selectedTab = updatedSelectedTab;
				}
			}
		});
		this.saveStateImmediate();
	};

	// Debug Operations
	getStateSnapshot = () => JSON.parse(JSON.stringify(this.state));
	forceSave = () => this.saveStateImmediate();

	// Others
	resetToDefault = async () => {
		runInAction(() => {
			this.state = { ...DEFAULT_STATE };
		});
		await this.saveStateImmediate();
	};
}

const appStore = new RootStore();

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(window as any).store = appStore;
}

export default appStore;
