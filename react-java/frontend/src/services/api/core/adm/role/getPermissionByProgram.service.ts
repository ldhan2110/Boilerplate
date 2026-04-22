import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { PermissionDto, ProgramDto } from '@/types';
import axios from 'axios';

export async function getPermissionByProgram(request: ProgramDto): Promise<PermissionDto[]> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.SYS.PROGRAM.GET_PERMISSION_BY_PROGRAM);
	const resp = await axios.post<PermissionDto[]>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
