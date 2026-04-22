import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { MasterCodeListDto, SearchMasterCodeDto } from '@/types';
import axios from 'axios';

export async function getListMasterCode(request: SearchMasterCodeDto): Promise<MasterCodeListDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.COM.CODE.GET_LIST_MASTER_CODE);
	const resp = await axios.post<MasterCodeListDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}

