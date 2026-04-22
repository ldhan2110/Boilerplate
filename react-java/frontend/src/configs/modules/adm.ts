/**
 * ADM Module API Endpoints
 */
export const ADM_ENDPOINTS = {
	AUTH: {
		LOGIN: '/adm/auth/login',
		LOGOUT: '/adm/auth/logout',
		REFRESH_TOKEN: '/adm/auth/refresh-token',
		GET_ROLE: '/adm/auth/getUserRole',
	},
	USER: {
		GET_USER_INFO_LIST: '/adm/user/getListUserInfo',
		GET_USER_INFO: '/adm/user/getUserInfo',
		ADD_NEW_USER: '/adm/user/createUser',
		UPDATE_USER: '/adm/user/updateUser',
		CHANGE_USER_INFO: '/adm/user/changeUserInfo',
		RESET_USER_PASSWORD: '/adm/user/resetUserPassword',
		EXPORT_EXCEL: '/adm/user/exportExcel',
		SAVE_USER_SETTING: '/adm/user/saveUserSetting',
	},
	ROLE: {
		GET_ROLE_LIST: '/adm/role/getRoleList',
		GET_ROLE: '/adm/role/getRole',
		ADD_NEW_ROLE: '/adm/role/insertRole',
		UPDATE_ROLE: '/adm/role/updateRole',
	},
};

