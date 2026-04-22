import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { MasterCodeDto, SearchMasterCodeDto } from '@/types';
import axios from 'axios';

export async function getMasterCode(request: SearchMasterCodeDto): Promise<MasterCodeDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.COM.CODE.GET_MASTER_CODE);
	const resp = await axios.post<MasterCodeDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}






