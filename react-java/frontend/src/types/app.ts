/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FormInstance } from 'antd';
import type { Locale } from 'antd/es/locale';
import type { ReactNode } from 'react';
import type { TableData } from './table';
import type { SubCodeDto } from './api';

export type TLang = 'en' | 'kr' | 'vn';

export interface Tab {
	key: string;
	label: string;
	hasChanged?: boolean;
	params?: any;
}

export type TabConfig = Partial<Tab>;

export interface AppState {
	dateFormat: DateFormat;
	darkMode: boolean;
	lang: TLang;
	sidebarVisible: boolean;
	localeProvider: Locale;
	openedTabs: Tab[];
	selectedTab: Tab;
	hasBackgroundTask: boolean;
	primaryColor: string;
}

export type MenuTree = {
	key: React.Key;
	label: string;
	icon: ReactNode;
};

export interface AppStore {
	state: AppState;

	// Dark Mode Management
	toggleDarkMode: () => void;
	setDarkMode: (darkMode: boolean) => void;

	// Language & Date Format Management
	setLang: (lang: TLang) => void;
	setDateFormat: (dateFormat: DateFormat) => void;

	// Primary Color Management
	setPrimaryColor: (primaryColor: string) => void;

	// Tabs Managaments
	openTab: (screen: Tab) => void;
	closeTab: (screenKey: string) => void;
	closeOtherTabs: (screenKey: string) => void;
	setSelectedTab: (screenKey: string) => void;
	redirectHome: () => void;
	openTabByKey: (screenKey: string) => void;
	openNewTabByKey: (screenKey: string, configs?: TabConfig) => void;
	reorderTabs: (newOrder: Tab[]) => void;
}

export enum DateFormat {
	DD_MM_YYYY_HH_MM_SS = 'DD/MM/YYYY HH:mm:ss',
	MM_DD_YYYY_HH_MM_SS = 'MM/DD/YYYY HH:mm:ss',
	YYYY_MM_DD_HH_MM_SS = 'YYYY/MM/DD HH:mm:ss',
}

export type Loose<T> = Partial<T> & { [key: string]: any };

export type AppForm = FormInstance & {
	formName: string;
	setInitialFieldsValue: (initValues: Loose<any>) => void;
	resetInitialFieldsValue: () => void;
	snapshotCurrentAsInitial: () => void;
	getInitFormValues: () => Loose<any>;
	checkFormChange: () => boolean;
	checkUnsavedFormChange: (callback?: (() => void) | undefined) => boolean;
};

export type SearchModalProps<T> = {
	open?: boolean;
	title?: string;
	selectType: 'single' | 'multiple';
	fieldName?: string;
	fieldValue?: any;
	width?: number;
	initialSearchValues: {
		[key: string]: any;
	};
	onConfirm?: () => void;
	onSelect?: (record: TableData<T>) => void;
	onCancel?: () => void;
};

export type RangeValue = [number | null, number | null];

export interface Favorite {
	favId: number;
	coId: string;
	usrId: string;
	pgmCd: string;
	creDt: number;
	updDt: number;
}


export type AppOption = SubCodeDto & { label: string; value: string }