import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { RoleDto, SearchRoleDto } from '@/types';
import axios from 'axios';

export async function getRole(request: SearchRoleDto): Promise<RoleDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.ADM.ROLE.GET_ROLE);
	const resp = await axios.post<RoleDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
