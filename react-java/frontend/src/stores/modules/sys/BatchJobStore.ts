import { DEFAULT_PAGINATION } from '@/constants';
import { authService } from '@/services/auth/authJwtService';
import type { BatchJobConfigDto, Pagination, SearchBatchJobConfigDto, SearchBatchJobExecutionHistoryDto, Sort, TableData } from '@/types';
import type { FormInstance } from 'antd';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface BatchJobStoreState {
    search: {
        filter: Partial<SearchBatchJobConfigDto>;
        pagination: Pagination;
        sort: Partial<Sort>;
    };
    searchHistoryCondition: {
        filter: Partial<SearchBatchJobExecutionHistoryDto>;
        pagination: Pagination;
        sort: Partial<Sort>;
    }
    selectedRowId: string;
    rowSelection: TableData<BatchJobConfigDto>[];
    clearHistorySearch: (form: FormInstance) => void;
    clearSearch: (form: FormInstance) => void;
    setHistoryFilter: (filter: Partial<SearchBatchJobExecutionHistoryDto>) => void;
    setFilter: (filter: Partial<SearchBatchJobConfigDto>) => void;
    setHistoryPagination: (current: number, pageSize: number) => void;
    setHistorySort: (sort: Partial<Sort>) => void;
    setPagination: (current: number, pageSize: number) => void;
    setSort: (sort: Partial<Sort>) => void;
    setRowSelection: (rowSelection: TableData<BatchJobConfigDto>[]) => void;
    setSelectedRowId: (id: string) => void;
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
    searchHistoryCondition: INITIAL_SEARCH_STATE,
    rowSelection: [],
    selectedRowId: '',
};

export const useBatchJobStore = create(
    devtools<BatchJobStoreState>((set) => ({
        ...INITIAL_STATE,
        setHistoryPagination: (current: number, pageSize: number) => {
            set((state) => ({
                searchHistoryCondition: {
                    ...state.searchHistoryCondition,
                    pagination: {
                        current,
                        pageSize,
                    },
                },
            }));
        },
        setHistorySort: (sort: Partial<Sort>) => {
            set((state) => ({
                searchHistoryCondition: { ...state.searchHistoryCondition, sort },
            }));
        },
        setHistoryFilter: (filter: Partial<SearchBatchJobExecutionHistoryDto>) => {
            set((state) => ({
                searchHistoryCondition: { ...state.searchHistoryCondition, filter: { ...state.searchHistoryCondition.filter, ...filter } },
            }));
        },
        clearHistorySearch: (form: FormInstance) => {
            // IMPORTANT: Need to set timeout because the form is running asynchrous
            setTimeout(() => {
                form.resetFields();
            }, 0);
            set({ searchHistoryCondition: INITIAL_SEARCH_STATE });
        },
        clearSearch: (form: FormInstance) => {
            // IMPORTANT: Need to set timeout because the form is running asynchrous
            setTimeout(() => {
                form.resetFields();
            }, 0);
            set({ search: INITIAL_SEARCH_STATE });
        },
        setFilter: (filter: Partial<SearchBatchJobConfigDto>) => {
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
        setRowSelection: (rowSelection: TableData<BatchJobConfigDto>[]) => {
            set(() => ({
                rowSelection,
            }));
        },
        setSelectedRowId: (id: string) => {
            set(() => ({
                selectedRowId: id,
            }));
        }
    })),
);
