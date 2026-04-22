import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { MasterCodeDto, SuccessDto } from '@/types';
import axios from 'axios';

export async function createMasterCode(request: MasterCodeDto): Promise<SuccessDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.COM.CODE.CREATE_MASTER_CODE);
	const resp = await axios.post<SuccessDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}






