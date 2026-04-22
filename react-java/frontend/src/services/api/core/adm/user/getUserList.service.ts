import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { SearchUserDto, UserInfoListDto } from '@/types';
import axios from 'axios';

export async function getUsersList(request: SearchUserDto): Promise<UserInfoListDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.ADM.USER.GET_USER_INFO_LIST);
	const resp = await axios.post<UserInfoListDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
