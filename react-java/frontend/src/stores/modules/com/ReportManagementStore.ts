import { DEFAULT_PAGINATION } from "@/constants";
import { getProgramList } from "@/services/api";
import { authService } from "@/services/auth/authJwtService";
import type { Pagination, ProgramDto, ReportDto, SearchReportDto, Sort, TableData } from "@/types";
import type { FormInstance } from "antd";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface ReportManagementStoreState {
	search: {
		filter: Partial<SearchReportDto>;
		pagination: Pagination;
		sort: Partial<Sort>;
	};
	options: {
		programList: ProgramDto[];
	}
    selectedRows: TableData<ReportDto>[];
    selectedReportCd: string | null;
	initOptions: () => void;
    setFilter: (filter: Partial<SearchReportDto>) => void;
	setSort: (sort: Partial<Sort>) => void;
	setPagination: (current: number, pageSize: number) => void;
    clearSearch: (form: FormInstance) => void;
    setSelectedRows: (data: TableData<ReportDto>[]) => void;
    setSelectedReportCd: (data: string | null) => void;
}

const INITIAL_SEARCH_STATE = {
	filter: {
		coId: authService.getCurrentUser()?.userInfo.coId,
		useFlg: '',
	},
	sort: {},
	pagination: DEFAULT_PAGINATION,
};

const INITIAL_STATE = {
	search: INITIAL_SEARCH_STATE,
	options: {
		programList: [],
	},
    selectedRows: [],
	selectedReportCd: null,
};

export const useReportManagementStore = create(
	devtools<ReportManagementStoreState>((set) => ({
		...INITIAL_STATE,
		initOptions: async () => {
			const programList = await getProgramList({
				coId: authService.getCurrentCompany()!,
				pgmTpCd: 'UI',
				useFlg: 'Y',
			});
			if (programList.programList) {
				set({ options: { programList: programList.programList } });
			}
		},
		clearSearch: (form: FormInstance) => {
			// IMPORTANT: Need to set timeout because the form is running asynchrous
			setTimeout(() => {
				form.resetFields();
			}, 0);
			set({ search: INITIAL_SEARCH_STATE, selectedReportCd: null, selectedRows: [] });
		},
		setFilter: (filter: Partial<SearchReportDto>) => {
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
        setSelectedReportCd: (data: string | null) => {
			set(() => ({
				selectedReportCd: data,
			}));
		},
        setSelectedRows: (data: TableData<ReportDto>[]) => {
			set(() => ({
				selectedRows: data,
			}));
		},
	})),
);