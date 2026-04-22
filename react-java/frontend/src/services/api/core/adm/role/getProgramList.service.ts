import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { ProgramListDto, SearchProgramDto } from '@/types';
import axios from 'axios';

export async function getProgramList(request: SearchProgramDto): Promise<ProgramListDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.SYS.PROGRAM.GET_PROGRAM_LIST);
	const resp = await axios.post<ProgramListDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
