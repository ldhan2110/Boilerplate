import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import axios from 'axios';

export async function getReportFileAsPdf(rptCd: string): Promise<Blob> {
	const url = getApiUrl(`${API_CONFIG.ENDPOINTS.COM.REPORT.GET_REPORT_FILE_PDF}/${rptCd}/file/pdf`);
	const resp = await axios.get<Blob>(url, {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
		responseType: 'blob',
		withCredentials: true,
	});
	return resp.data;
}
