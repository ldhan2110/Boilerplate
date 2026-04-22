import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { RoleListDto, SearchRoleDto } from '@/types';
import axios from 'axios';

export async function getRoleList(request: SearchRoleDto): Promise<RoleListDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.ADM.ROLE.GET_ROLE_LIST);
	const resp = await axios.post<RoleListDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
