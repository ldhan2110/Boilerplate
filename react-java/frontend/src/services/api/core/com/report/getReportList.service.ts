import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { ReportListDto, SearchReportDto } from '@/types';
import axios from 'axios';

export async function getReportList(request: SearchReportDto): Promise<ReportListDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.COM.REPORT.GET_REPORT_LIST);
	const resp = await axios.post<ReportListDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
