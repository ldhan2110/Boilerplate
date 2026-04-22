import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { SearchUserDto, UserInfoDto } from '@/types';
import axios from 'axios';

export async function getUserInfo(request: SearchUserDto): Promise<UserInfoDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.ADM.USER.GET_USER_INFO);
	const resp = await axios.post<UserInfoDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
