import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { SuccessDto, UserInfoDto } from '@/types';
import axios from 'axios';

export type ChangeUserInfoRequest = UserInfoDto & {
	currentPassword?: string;
	newPassword?: string;
	confirmPassword?: string;
};

export type ChangeUserInfoDto = UserInfoDto & {
	oldPassword?: string;
	newPassword?: string;
	confirmNewPassword?: string;
};

export async function changeUserInfo(request: ChangeUserInfoRequest): Promise<SuccessDto> {
	// Map frontend field names to backend field names
	const payload: ChangeUserInfoDto = {
		...request,
		oldPassword: request.currentPassword,
		newPassword: request.newPassword,
		confirmNewPassword: request.confirmPassword,
	};
	
	// Remove frontend field names
	delete (payload as ChangeUserInfoRequest).currentPassword;
	delete (payload as ChangeUserInfoRequest).confirmPassword;
	
	const url = getApiUrl(API_CONFIG.ENDPOINTS.ADM.USER.CHANGE_USER_INFO);
	
	// Always use FormData because backend uses @ModelAttribute which only accepts form data
	const formData = new FormData();
	
	// Append all non-file fields
	Object.entries(payload).forEach(([key, value]) => {
		// Skip usrFile - handle separately
		if (key === 'usrFile') {
			return;
		}
		
		// Only append defined values
		if (value !== undefined && value !== null) {
			// Convert dates to ISO string if needed
			const val = value as unknown;
			if (val instanceof Date) {
				formData.append(key, val.toISOString());
			} else if (typeof val === 'object') {
				// Skip objects (except Date which is handled above)
				return;
			} else {
				formData.append(key, String(val));
			}
		}
	});
	
	// Append usrFile if it exists
	const usrFile = (request as ChangeUserInfoRequest & { usrFile?: File | Blob }).usrFile;
	if (usrFile && (usrFile instanceof File || usrFile instanceof Blob)) {
		formData.append('usrFile', usrFile);
	}
	
	const resp = await axios.post<SuccessDto>(url, formData, {
		headers: {
			// Don't set Content-Type - let axios set it with boundary for multipart/form-data
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
		withCredentials: true,
	});
	return resp.data;
}

