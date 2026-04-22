import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { ReportDto, SuccessDto } from '@/types';
import axios from 'axios';

export async function updateReport(report: ReportDto, file?: File): Promise<SuccessDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.COM.REPORT.UPDATE_REPORT);
	
	// Create FormData for multipart/form-data upload
	const formData = new FormData();
	
	// Append report as JSON string
	formData.append('report', JSON.stringify(report));
	
	// Append file if provided
	if (file) {
		formData.append('file', file);
	}
	
	const resp = await axios.post<SuccessDto>(url, formData, {
		headers: {
			withCredentials: true,
			// Don't set Content-Type - let axios set it with boundary for multipart/form-data
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
