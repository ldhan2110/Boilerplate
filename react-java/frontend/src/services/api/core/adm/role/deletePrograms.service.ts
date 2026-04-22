import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { ProgramDto, SuccessDto } from '@/types';
import axios from 'axios';

export async function deletePrograms(request: ProgramDto[]): Promise<SuccessDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.SYS.PROGRAM.DELETE_PROGRAMS);
	const resp = await axios.post<SuccessDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
