import { DEFAULT_PAGINATION } from '@/constants';
import { authService } from '@/services/auth/authJwtService';
import type {
	DetailCodeFilterForm,
	MasterCodeFilterForm,
	MasterCodeDto,
	Sort,
	SubCodeDto,
	TableData,
	Pagination,
	AppForm,
} from '@/types';
import type { FormInstance } from 'antd';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface CommonCodeManagementStoreState {
	// Master Code Section
	masterCodeSearch: {
		filter: Partial<MasterCodeFilterForm>;
		sort: Partial<Sort>;
		pagination: Pagination;
	};
	selectionMasterCodeRows: TableData<MasterCodeDto>[];
	selectedMasterCode: MasterCodeDto | null;
	selectedMasterCodeId: string | null; // mstCd
	masterCodeTableForm: AppForm | null;

	// Detail Code Section
	detailCodeSearch: {
		filter: Partial<DetailCodeFilterForm>;
		useFlg?: string; // Filter by use flag
	};
	selectionDetailCodeRows: TableData<SubCodeDto>[];
	subCodeTableForm: AppForm | null;

	// Actions
	clearMasterCodeSearch: (form: FormInstance) => void;
	setMasterCodeFilter: (filter: Partial<MasterCodeFilterForm>) => void;
	setMasterCodeSort: (sort: Partial<Sort>) => void;
	setMasterCodePagination: (current: number, pageSize: number) => void;
	setSelectionMasterCodeRows: (rows: TableData<MasterCodeDto>[]) => void;
	setSelectedMasterCode: (masterCode: MasterCodeDto | null) => void;
	setSelectedMasterCodeId: (mstCd: string | null) => void;
	setMasterCodeTableForm: (form: AppForm) => void;

	clearDetailCodeSearch: (form: FormInstance) => void;
	setDetailCodeFilter: (filter: Partial<DetailCodeFilterForm>) => void;
	setDetailCodeUseFlg: (useFlg: string) => void;
	setSelectionDetailCodeRows: (rows: TableData<SubCodeDto>[]) => void;
	setSubCodeTableForm: (form: AppForm) => void;
}

const INITIAL_MASTER_CODE_SEARCH_STATE = {
	filter: {
		useFlg: '',
		coId: authService.getCurrentUser()?.userInfo.coId,
	},
	sort: {},
	pagination: DEFAULT_PAGINATION,
};

const INITIAL_DETAIL_CODE_SEARCH_STATE = {
	filter: {},
	useFlg: '',
};

const INITIAL_STATE = {
	masterCodeSearch: INITIAL_MASTER_CODE_SEARCH_STATE,
	selectionMasterCodeRows: [],
	selectedMasterCode: null,
	selectedMasterCodeId: null,
	detailCodeSearch: INITIAL_DETAIL_CODE_SEARCH_STATE,
	selectionDetailCodeRows: [],
	subCodeTableForm: null,
	masterCodeTableForm: null,
};

export const useCommonCodeManagementStore = create(
	devtools<CommonCodeManagementStoreState>((set) => ({
		...INITIAL_STATE,
		clearMasterCodeSearch: (form: FormInstance) => {
			setTimeout(() => {
				form.resetFields();
			}, 0);
			set({
				masterCodeSearch: INITIAL_MASTER_CODE_SEARCH_STATE,
				selectionMasterCodeRows: [],
				selectedMasterCode: null,
				selectedMasterCodeId: null,
			});
		},
		setMasterCodeFilter: (filter: Partial<MasterCodeFilterForm>) => {
			set((state) => ({
				masterCodeSearch: {
					...state.masterCodeSearch,
					filter: { ...state.masterCodeSearch.filter, ...filter },
				},
			}));
		},
		setMasterCodeSort: (sort: Partial<Sort>) => {
			set((state) => ({
				masterCodeSearch: {
					...state.masterCodeSearch,
					sort,
				},
			}));
		},
		setMasterCodePagination: (current: number, pageSize: number) => {
			set((state) => ({
				masterCodeSearch: {
					...state.masterCodeSearch,
					pagination: { current, pageSize },
				},
			}));
		},
		setSelectionMasterCodeRows: (rows: TableData<MasterCodeDto>[]) => {
			set(() => ({
				selectionMasterCodeRows: rows,
			}));
		},
		setSelectedMasterCode: (masterCode: MasterCodeDto | null) => {
			set(() => ({
				selectedMasterCode: masterCode,
				selectedMasterCodeId: masterCode?.mstCd || null,
			}));
		},
		setSelectedMasterCodeId: (mstCd: string | null) => {
			set(() => ({
				selectedMasterCodeId: mstCd,
			}));
		},
		setMasterCodeTableForm: (form: AppForm) => {
			set(() => ({
				masterCodeTableForm: form,
			}));
		},
		clearDetailCodeSearch: (form: FormInstance) => {
			setTimeout(() => {
				form.resetFields();
			}, 0);
			set({
				detailCodeSearch: INITIAL_DETAIL_CODE_SEARCH_STATE,
				selectionDetailCodeRows: [],
			});
		},
		setDetailCodeFilter: (filter: Partial<DetailCodeFilterForm>) => {
			set((state) => ({
				detailCodeSearch: {
					...state.detailCodeSearch,
					filter: { ...state.detailCodeSearch.filter, ...filter },
				},
			}));
		},
		setDetailCodeUseFlg: (useFlg: string) => {
			set((state) => ({
				detailCodeSearch: {
					...state.detailCodeSearch,
					useFlg,
				},
			}));
		},
		setSelectionDetailCodeRows: (rows: TableData<SubCodeDto>[]) => {
			set(() => ({
				selectionDetailCodeRows: rows,
			}));
		},
		setSubCodeTableForm: (form: AppForm) => {
			set(() => ({
				subCodeTableForm: form,
			}));
		},
	})),
);

