import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { BatchJobConfigDto, SuccessDto } from '@/types';
import axios from 'axios';

export async function pauseBatchJob(request: BatchJobConfigDto): Promise<SuccessDto> {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.SYS.BATCH_JOB.PAUSE_BATCH_JOB);
    const resp = await axios.post<SuccessDto>(url, request, {
        headers: {
            withCredentials: true,
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authService.getAccessToken()}`,
        },
    });
    return resp.data;
}
