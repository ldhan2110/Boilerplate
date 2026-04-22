import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { SuccessDto } from '@/types';
import axios from 'axios';

export async function deleteReport(rptId: string[]): Promise<SuccessDto> {
	const url = getApiUrl(`${API_CONFIG.ENDPOINTS.COM.REPORT.DELETE_REPORT}`);
	const resp = await axios.post<SuccessDto>(url, rptId, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
