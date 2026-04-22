/**
 * COM Module API Endpoints
 */
export const COM_ENDPOINTS = {
	FILE: {
		DOWLOAD_FILE: '/com/file/download',
	},
	CODE: {
		GET_LIST_MASTER_CODE: '/com/code/getListMasterCode',
		GET_MASTER_CODE: '/com/code/getMasterCode',
		GET_COMMON_CODE: '/com/code/getCommonCode',
		CREATE_MASTER_CODE: '/com/code/createMasterCode',
		UPDATE_MASTER_CODE: '/com/code/updateMasterCode',
		SAVE_MASTER_CODE: '/com/code/saveMasterCode',
		SAVE_SUB_CODE: '/com/code/saveSubCode',
		INVALIDATE_COMMON_CODE: '/com/code/invalidateSubCodeCache',
	},
	REPORT: {
		GET_REPORT_LIST: '/com/reports/list',
		GET_REPORT: '/com/reports',
		INSERT_REPORT: '/com/reports/insert',
		UPDATE_REPORT: '/com/reports/update',
		DELETE_REPORT: '/com/reports/delete',
		GET_REPORT_FILE_PDF: '/com/reports',
	},
};
