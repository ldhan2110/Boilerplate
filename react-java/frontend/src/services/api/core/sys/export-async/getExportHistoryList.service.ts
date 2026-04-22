import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { ExportJobListDto, SearchExportJobDto } from '@/types';
import axios from 'axios';

export async function getExportHistoryList(request: SearchExportJobDto): Promise<ExportJobListDto> {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.SYS.EXPORT_JOB.GET_EXPORT_HISTORY_LIST);
    const resp = await axios.post<ExportJobListDto>(url, request, {
        headers: {
            withCredentials: true,
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authService.getAccessToken()}`,
        },
    });
    return resp.data;
}
