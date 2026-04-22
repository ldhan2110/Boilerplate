import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import axios from 'axios';

export async function generateReportByCode(
  rptCd: string,
  params: Record<string, any> = {},
): Promise<Blob> {
  const url = getApiUrl(
    `${API_CONFIG.ENDPOINTS.COM.REPORT.GET_REPORT_FILE_PDF}/by-report/${rptCd}/generate-pdf`,
  );

  const resp = await axios.post<Blob>(url, params, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authService.getAccessToken()}`,
    },
    responseType: 'blob',
    withCredentials: true,
  });

  return resp.data;
}

