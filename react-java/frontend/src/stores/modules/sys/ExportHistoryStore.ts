import { DEFAULT_PAGINATION } from '@/constants';
import { authService } from '@/services/auth/authJwtService';
import type { Pagination, SearchExportJobDto, Sort } from '@/types';
import type { FormInstance } from 'antd';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import dayjs from 'dayjs';

interface ExportHistoryStoreState {
    search: {
        filter: Partial<SearchExportJobDto>;
        pagination: Pagination;
        sort: Partial<Sort>;
    };
    clearSearch: (form: FormInstance) => void;
    setFilter: (filter: Partial<SearchExportJobDto>) => void;
    setPagination: (current: number, pageSize: number) => void;
    setSort: (sort: Partial<Sort>) => void;
}

const INITIAL_SEARCH_STATE = {
    filter: {
        coId: authService.getCurrentUser()?.userInfo.coId,
        dateFm: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        dateTo: dayjs().format('YYYY-MM-DD'),
    },
    sort: {},
    pagination: DEFAULT_PAGINATION,
};

const INITIAL_STATE = {
    search: INITIAL_SEARCH_STATE,
};

export const useExportHistoryStore = create(
    devtools<ExportHistoryStoreState>((set) => ({
        ...INITIAL_STATE,
        clearSearch: (form: FormInstance) => {
            // IMPORTANT: Need to set timeout because the form is running asynchrous
            setTimeout(() => {
                form.resetFields();
            }, 0);
            set({ search: INITIAL_SEARCH_STATE });
        },
        setFilter: (filter: Partial<SearchExportJobDto>) => {
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
    })),
);
