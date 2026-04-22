import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { BatchJobExecutionHistoryListDto, SearchBatchJobExecutionHistoryDto } from '@/types';
import axios from 'axios';

export async function getBatchJobHistory(request: SearchBatchJobExecutionHistoryDto): Promise<BatchJobExecutionHistoryListDto> {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.SYS.BATCH_JOB.GET_BATCH_JOB_HISTORY_LIST);
    const resp = await axios.post<BatchJobExecutionHistoryListDto>(url, request, {
        headers: {
            withCredentials: true,
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authService.getAccessToken()}`,
        },
    });
    return resp.data;
}
