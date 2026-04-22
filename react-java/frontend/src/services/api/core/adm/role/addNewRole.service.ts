import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { RoleDto, SuccessDto } from '@/types';
import axios from 'axios';

export async function addNewRole(request: RoleDto): Promise<SuccessDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.ADM.ROLE.ADD_NEW_ROLE);
	const resp = await axios.post<SuccessDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
