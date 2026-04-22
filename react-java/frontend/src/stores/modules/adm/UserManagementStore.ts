import { DEFAULT_PAGINATION } from '@/constants';
import { authService } from '@/services/auth/authJwtService';
import type { Pagination, Sort, TableData, UserInfoDto, UserListFilterForm } from '@/types';
import type { FormInstance } from 'antd';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UserManagementStoreState {
	search: {
		filter: Partial<UserListFilterForm>;
		pagination: Pagination;
		sort: Partial<Sort>;
	};
	selectionRows: TableData<UserInfoDto>[];
	selectedUserId: string | null;
	clearSearch: (form: FormInstance) => void;
	setFilter: (filter: Partial<UserListFilterForm>) => void;
	setPagination: (current: number, pageSize: number) => void;
	setSort: (sort: Partial<Sort>) => void;
	setSelectionRows: (selectedRows: TableData<UserInfoDto>[]) => void;
	setSelectedUserId: (usrId: string) => void;
}

const INITIAL_SEARCH_STATE = {
	filter: {
		useFlg: '',
		coId: authService.getCurrentUser()?.userInfo.coId,
	},
	sort: {},
	pagination: DEFAULT_PAGINATION,
};

const INITIAL_STATE = {
	search: INITIAL_SEARCH_STATE,
	selectionRows: [],
	selectedUserId: null,
};

export const useUserManagementStore = create(
	devtools<UserManagementStoreState>((set) => ({
		...INITIAL_STATE,
		clearSearch: (form: FormInstance) => {
			// IMPORTANT: Need to set timeout because the form is running asynchrous
			setTimeout(() => {
				form.resetFields();
			}, 0);
			set({ search: INITIAL_SEARCH_STATE });
		},
		setFilter: (filter: Partial<UserListFilterForm>) => {
			set((state) => ({
				search: { ...state.search, filter: { ...state.search.filter, ...filter } },
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
		setSelectionRows: (selectedRows: TableData<UserInfoDto>[]) => {
			set(() => ({
				selectionRows: selectedRows,
			}));
		},
		setSelectedUserId: (userId: string) => {
			set(() => ({
				selectedUserId: userId,
			}));
		},
	})),
);
