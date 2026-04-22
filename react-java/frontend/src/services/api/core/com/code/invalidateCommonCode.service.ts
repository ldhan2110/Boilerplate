import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { SuccessDto } from '@/types';
import axios from 'axios';

export async function invalidateCommonCode(coId: string): Promise<SuccessDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.COM.CODE.INVALIDATE_COMMON_CODE);
	const resp = await axios.get<SuccessDto>(`${url}/${coId}`, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}






