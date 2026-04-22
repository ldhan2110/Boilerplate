import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { ProgramDto, SearchProgramDto } from '@/types';
import axios from 'axios';

export async function getProgram(request: SearchProgramDto): Promise<ProgramDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.SYS.PROGRAM.GET_PROGRAM);
	const resp = await axios.post<ProgramDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
