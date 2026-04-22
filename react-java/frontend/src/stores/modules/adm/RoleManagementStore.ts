import { DEFAULT_PAGINATION } from '@/constants';
import { authService } from '@/services/auth/authJwtService';
import type {
	AppForm,
	Pagination,
	PermissionDto,
	ProgramDto,
	ProgramListFilterForm,
	ProgramTree,
	RoleAuthDto,
	RoleDto,
	RoleListFilterForm,
	Sort,
	TableData,
} from '@/types';
import type { FormInstance } from 'antd';
import { isEqual } from 'lodash';
import { create } from 'zustand';

interface RoleManagementStoreState {
	search: {
		programFilter: {
			filter: Partial<ProgramListFilterForm>;
		};
		roleFilter: {
			filter: Partial<RoleListFilterForm>;
			pagination: Pagination;
			sort: Partial<Sort>;
		};
	};

	// Program View
	hideSavePermButton: boolean;
	permissionTableForm: AppForm | null;
	selectionRoleRows: TableData<RoleDto>[];
	selectionProgramRows: TableData<ProgramTree>[];
	selectionPermissionRows: TableData<PermissionDto>[];
	selectedProgramId: string | null;
	selectedProgram: ProgramDto | null;

	// Role View
	selectedRoleId: string | null;
	selectedRoleProgram: ProgramTree | null;
	roleAuthList: RoleAuthDto[];

	clearPgmSearch: (form: FormInstance<ProgramListFilterForm>) => void;
	setProgramFilter: (filter: Partial<ProgramListFilterForm>) => void;
	setSelectedProgramId: (id: string) => void;
	setSelectionPrograms: (selectedRows: TableData<ProgramTree>[]) => void;

	clearRoleSearch: (form: FormInstance<RoleListFilterForm>) => void;
	setSelectionRoles: (selectedRows: TableData<RoleDto>[]) => void;
	setRoleFilter: (filter: Partial<RoleListFilterForm>) => void;
	setRoleSort: (sort: Partial<Sort>) => void;
	setRolePagination: (current: number, pageSize: number) => void;

	setSelectionPermissions: (selectedRows: TableData<PermissionDto>[]) => void;
	setSelectedProgram: (program: ProgramDto | null) => void;
	setPermissionTableForm: (form: AppForm) => void;
	setHideSavePermBtn: (isHide: boolean) => void;

	setSelectedRoleProgram: (program: ProgramTree) => void;
	setSelectedRoleId: (roleId: string) => void;
	addRoleAuth: (pgmList: string[], roleAuth: RoleAuthDto) => void;
	removeRoleAuth: (pgmList: string[], roleAuth: RoleAuthDto) => void;
	setRoleAuthList: (roleAuthList: RoleAuthDto[]) => void;
	resetRoleProgram: () => void;
}

const INITIAL_PGM_SEARCH_STATE = {
	filter: {
		useFlg: '',
		coId: authService.getCurrentUser()?.userInfo.coId,
	},
};

const INITIAL_ROLE_SEARCH_STATE = {
	filter: {
		useFlg: '',
		coId: authService.getCurrentUser()?.userInfo.coId,
	},
	sort: {},
	pagination: DEFAULT_PAGINATION,
};

const INITIAL_STATE = {
	search: {
		programFilter: INITIAL_PGM_SEARCH_STATE,
		roleFilter: INITIAL_ROLE_SEARCH_STATE,
	},

	// Program View
	hideSavePermButton: true,
	permissionTableForm: null,
	showSavePermButton: false,
	selectionRoleRows: [],
	selectionProgramRows: [],
	selectionPermissionRows: [],
	selectedRoleId: null,
	selectedProgramId: null,
	selectedProgram: null,

	// Role View
	selectedRoleProgram: null,
	roleAuthList: [],
};

export const useRoleManagementStore = create<RoleManagementStoreState>((set) => ({
	...INITIAL_STATE,
	clearPgmSearch: (form: FormInstance<ProgramListFilterForm>) => {
		setTimeout(() => {
			form.resetFields();
		}, 0);
		set((state) => ({
			search: {
				...state.search,
				programFilter: INITIAL_PGM_SEARCH_STATE,
			},
			hideSavePermButton: true,
			permissionTableForm: null,
			showSavePermButton: false,
			selectionRoleRows: [],
			selectionProgramRows: [],
			selectionPermissionRows: [],
			selectedRoleId: null,
			selectedProgramId: null,
			selectedProgram: null,
		}));
	},
	clearRoleSearch: (form: FormInstance<RoleListFilterForm>) => {
		setTimeout(() => {
			form.resetFields();
		}, 0);
		set((state) => ({
			search: {
				...state.search,
				roleFilter: INITIAL_ROLE_SEARCH_STATE,
			},
		}));
	},
	setSelectionRoles: (selectedRows: TableData<RoleDto>[]) => {
		set(() => ({
			selectionRoleRows: selectedRows,
		}));
	},
	setSelectionPrograms: (selectedRows: TableData<ProgramTree>[]) => {
		set(() => ({
			selectionProgramRows: selectedRows,
		}));
	},
	setRoleFilter: (filter: Partial<RoleListFilterForm>) => {
		set((state) => ({
			search: {
				...state.search,
				roleFilter: {
					...state.search.roleFilter,
					filter: { ...state.search.roleFilter.filter, ...filter },
				},
			},
		}));
	},
	setProgramFilter: (filter: Partial<ProgramListFilterForm>) => {
		set((state) => ({
			search: {
				...state.search,
				programFilter: {
					...state.search.programFilter,
					filter: { ...state.search.programFilter.filter, ...filter },
				},
			},
		}));
	},
	setRoleSort: (sort: Partial<Sort>) => {
		set((state) => ({
			search: {
				...state.search,
				roleFilter: {
					...state.search.roleFilter,
					sort: { ...sort },
				},
			},
		}));
	},
	setRolePagination: (current: number, pageSize: number) => {
		set((state) => ({
			search: {
				...state.search,
				roleFilter: {
					...state.search.roleFilter,
					pagination: { current, pageSize },
				},
			},
		}));
	},
	setSelectedProgramId: (id: string) => {
		set(() => ({
			selectedProgramId: id,
		}));
	},
	setSelectionPermissions: (selectedRows: TableData<PermissionDto>[]) => {
		set(() => ({
			selectionPermissionRows: selectedRows,
		}));
	},
	setSelectedProgram: (program: ProgramDto | null) => {
		set(() => ({
			selectedProgram: program,
		}));
	},
	setPermissionTableForm: (form: AppForm) => {
		set(() => ({
			permissionTableForm: form,
		}));
	},
	setHideSavePermBtn: (isHide: boolean) => {
		set(() => ({
			hideSavePermButton: isHide,
		}));
	},
	setSelectedRoleProgram: (program: ProgramTree) => {
		set(() => ({
			selectedRoleProgram: program,
		}));
	},
	setSelectedRoleId: (roleId: string) => {
		set(() => ({
			selectedRoleId: roleId,
		}));
	},
	setRoleAuthList: (roleAuthList: RoleAuthDto[]) => {
		set((state) => {
			if (isEqual(state.roleAuthList, roleAuthList)) {
				return {};
			}
			return { roleAuthList };
		}, false);
	},
	resetRoleProgram: () => {
		set(() => ({
			selectedRoleId: null,
			selectedRoleProgram: null,
			roleAuthList: [],
		}));
	},
	addRoleAuth: (pgmList: string[], roleAuth: RoleAuthDto) => {
		set((state) => {
			if (!pgmList?.length || !roleAuth) return {};

			const currentList = state.roleAuthList ?? [];
			const updatedList = [...currentList];

			pgmList.forEach((pgmId) => {
				// Find if an existing record matches the same pgmId + permId
				const index = updatedList.findIndex(
					(item) => item.pgmId === pgmId && item.permCd === roleAuth.permCd, // Find by PERM_CD
				);

				if (index !== -1) {
					// Update existing roleAuth entry
					updatedList[index] = {
						...updatedList[index],
						...roleAuth,
						pgmId, // ensure pgmId is consistent
					};
				} else {
					// Add new roleAuth entry
					updatedList.push({
						...roleAuth,
						pgmId,
					});
				}
			});

			return { roleAuthList: updatedList };
		});
	},
	removeRoleAuth: (pgmList: string[], roleAuth?: RoleAuthDto) => {
		set((state) => {
			if (!Array.isArray(pgmList) || pgmList.length === 0) return {};

			const currentList = state.roleAuthList ?? [];

			const updatedList = currentList.filter((item) => {
				const pgmId = item.pgmId ?? '';
				const isInPgmList = pgmList.includes(pgmId);
				if (!isInPgmList) return true;
				else if (roleAuth?.permCd != item.permCd) return true;
				else return false;
			});

			if (updatedList.length === currentList.length) return {};

			return { roleAuthList: updatedList };
		});
	},
}));
