/**
 * SYS Module API Endpoints
 */
export const SYS_ENDPOINTS = {
	FAVORITES: {
		GET_FAVORITES: '/sys/favorites',
		ADD_FAVORITE: '/sys/favorites',
		REMOVE_FAVORITE: '/sys/favorites',
	},
	PROGRAM: {
		GET_PROGRAM_LIST: '/sys/program/getProgramList',
		GET_PROGRAM: '/sys/program/getProgram',
		GET_PERMISSION_BY_PROGRAM: '/sys/program/getPermissionByProgram',
		ADD_NEW_PROGRAM: '/sys/program/insertProgram',
		UPDATE_PROGRAM: '/sys/program/updateProgram',
		SAVE_PERMISSIONS: '/sys/program/savePermissionsByProgram',
		DELETE_PROGRAMS: '/sys/program/deletePrograms',
	},
	BATCH_JOB: {
		GET_BATCH_JOB_LIST: '/sys/batch/getBatchJobList',
		GET_BATCH_JOB_HISTORY_LIST: '/sys/batch/getBatchJobHistoryList',
		GET_BATCH_JOB: '/sys/batch/getBatchJob',
		REGISTER_BATCH_JOB: '/sys/batch/register',
		UPDATE_BATCH_JOB: '/sys/batch/update',
		PAUSE_BATCH_JOB: '/sys/batch/pause',
		RESUME_BATCH_JOB: '/sys/batch/resume',
		RUN_BATCH_JOB: '/sys/batch/run',
	},
	EXPORT_JOB: {
		GET_EXPORT_HISTORY_LIST: '/sys/exportJob/getExportJobList',
		CONFIRM_EXPORT_ASYNC: '/sys/exportJob/confirm',
		CANCEL_EXPORT_ASYNC: '/sys/exportJob/cancel',
	},
	ERROR_LOG: {
		GET_MESSAGE_HISTORY_LIST: '/sys/errorLog/getHistoryList',
	},
	MESSAGE_MANAGEMENT: {
		GET_MESSAGE_LIST: '/sys/comMsg/getMessageList',
		GET_MESSAGE: '/sys/comMsg/getMessage',
		UPDATE_MESSAGE: '/sys/comMsg/updateMessage',
		INSERT_MESSAGE: '/sys/comMsg/insertMessage',
		DELETE_MESSAGE: '/sys/comMsg/deleteMessage',
	},
	EMAIL: {
		GET_EMAIL_LIST: '/sys/email/getEmailList',
		GET_EMAIL: '/sys/email/getEmail',
		RESEND_EMAIL: '/sys/email/resendEmail',
		RESEND_EMAILS: '/sys/email/resendEmails',
		DELETE_EMAILS: '/sys/email/deleteEmails',
		SEND_EMAIL: '/sys/email/sendEmail',
	},
};

