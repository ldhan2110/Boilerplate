import { DEFAULT_PAGINATION } from '@/constants';
import { authService } from '@/services/auth/authJwtService';
import type { MessageDto, MessageTranslationDto, MessageListFilterForm, Pagination, Sort, TableData } from '@/types';
import type { FormInstance } from 'antd';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface MessageManagementStoreState {
	search: {
		filter: Partial<MessageListFilterForm>;
		pagination: Pagination;
		sort: Partial<Sort>;
	};
	selectMsgId: string | null;
	rowMsgSelection: TableData<MessageDto>[];
	selectedRows: TableData<MessageTranslationDto>[];
	clearSearch: (form: FormInstance) => void;
	setRowMsgSelection: (data: TableData<MessageDto>[]) => void;
	setSelectedMsgId: (msgId: string | null) => void;
	setSelectedRows: (data: TableData<MessageTranslationDto>[]) => void;
	setFilter: (filter: Partial<MessageListFilterForm>) => void;
	setSort: (sort: Partial<Sort>) => void;
	setPagination: (current: number, pageSize: number) => void;
}

const INITIAL_SEARCH_STATE = {
	filter: {
		coId: authService.getCurrentUser()?.userInfo.coId,
	},
	sort: {},
	pagination: DEFAULT_PAGINATION,
};

const INITIAL_STATE = {
	search: INITIAL_SEARCH_STATE,
	selectedRows: [],
	rowMsgSelection: [],
	selectMsgId: null,
};

export const useMessageManagementStore = create(
	devtools<MessageManagementStoreState>((set) => ({
		...INITIAL_STATE,
		clearSearch: (form: FormInstance) => {
			// IMPORTANT: Need to set timeout because the form is running asynchrous
			setTimeout(() => {
				form.resetFields();
			}, 0);
			set({ search: INITIAL_SEARCH_STATE });
		},
		setFilter: (filter: Partial<MessageListFilterForm>) => {
			set((state) => ({
				search: { ...state.search, filter: { ...state.search.filter, ...filter } },
			}));
		},
		setSelectedRows: (rows) => {
			set(() => ({
				selectedRows: rows,
			}));
		},
		setRowMsgSelection: (rows) => {
			set(() => ({
				rowMsgSelection: rows,
			}));
		},
		setSelectedMsgId: (msgId) => {
			set(() => ({
				selectMsgId: msgId,
			}));
		},
		setSort: (sort: Partial<Sort>) => {
			set((state) => ({
				search: { ...state.search, sort },
			}));
		},
		setPagination: (current: number, pageSize: number) => {
			set((state) => ({
				search: {
					...state.search,
					pagination: {
						current,
						pageSize,
					},
				},
			}));
		},
	})),
);

