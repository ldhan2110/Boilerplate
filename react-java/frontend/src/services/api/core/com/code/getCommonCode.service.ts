import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { GetCommonCodeRequestDto, SubCodeResponseDto } from '@/types';
import axios from 'axios';

export async function getCommonCode(request: GetCommonCodeRequestDto): Promise<SubCodeResponseDto[][]> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.COM.CODE.GET_COMMON_CODE);
	const resp = await axios.post<SubCodeResponseDto[][]>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}

