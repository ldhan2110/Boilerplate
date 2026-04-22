import type { AppForm } from '@/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type WatchFormList = {
	[key: string]: AppForm[]; // Keys is the Tab Key, each tabs will have its own watch form list
};

interface TabsStoreState {
	watchesFormList: WatchFormList;

	addWatchFormList: (tabKey: string, form: AppForm) => void;
	checkUnsaveChangeByTab: (tabKey: string, callback?: (() => void) | undefined) => void;
	clearWatchFormListByTab: (tabKey: string) => void;
	checkFormChangeByTab: (tabKey: string) => boolean;
	clearAllWatchFormList: () => void;
}

const INITIAL_STATE = {
	watchesFormList: {},
};

export const useTabsStore = create(
	devtools<TabsStoreState>((set, get) => ({
		...INITIAL_STATE,
		addWatchFormList: (tabKey, form) => {
			set((state) => {
				const existingForms = state.watchesFormList[tabKey] ?? [];

				// Convert existing array → Map keyed by form.name
				const formsMap = new Map(existingForms.map((f) => [f.formName, f] as const));

				// Insert or replace
				formsMap.set(form.formName, form);

				return {
					watchesFormList: {
						...state.watchesFormList,
						[tabKey]: Array.from(formsMap.values()),
					},
				};
			});
		},
		checkFormChangeByTab: (tabKey: string) => {
			const watchFormList = get().watchesFormList[tabKey] || [];
			for (const form of watchFormList) {
				const isChange = form.checkFormChange();
				if (isChange) return true;
			}
			return false;
		},
		checkUnsaveChangeByTab: (tabKey: string, callback?: () => void) => {
			const watchFormList = get().watchesFormList[tabKey] || [];
			for (const form of watchFormList) {
				const isSafe = form.checkUnsavedFormChange(callback);
				if (!isSafe) return;
			}
			callback?.();
		},
		clearWatchFormListByTab: (tabKey: string) => {
			set((state) => ({
				watchesFormList: {
					...state.watchesFormList,
					[tabKey]: [],
				},
			}));
		},
		clearAllWatchFormList: () => {
			set(() => ({
				watchesFormList: {},
			}));
		},
	})),
);
