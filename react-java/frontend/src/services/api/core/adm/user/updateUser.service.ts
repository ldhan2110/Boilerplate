import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { SuccessDto, UserInfoDto } from '@/types';
import axios from 'axios';

export async function updateUser(request: UserInfoDto): Promise<SuccessDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.ADM.USER.UPDATE_USER);
	const resp = await axios.post<SuccessDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
