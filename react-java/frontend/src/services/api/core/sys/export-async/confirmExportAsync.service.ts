import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { SuccessDto } from '@/types';
import axios from 'axios';

export async function confirmExportAsync(jobId: string): Promise<SuccessDto> {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.SYS.EXPORT_JOB.CONFIRM_EXPORT_ASYNC);
    const resp = await axios.get<SuccessDto>(`${url}/${jobId}`, {
        headers: {
            withCredentials: true,
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authService.getAccessToken()}`,
        },
    });
    return resp.data;
}
