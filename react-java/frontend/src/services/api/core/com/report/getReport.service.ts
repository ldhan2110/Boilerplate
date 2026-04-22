import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { ReportDto } from '@/types';
import axios from 'axios';

export async function getReport(rptId: string): Promise<ReportDto> {
	const url = getApiUrl(`${API_CONFIG.ENDPOINTS.COM.REPORT.GET_REPORT}/${rptId}`);
	const resp = await axios.get<ReportDto>(url, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
