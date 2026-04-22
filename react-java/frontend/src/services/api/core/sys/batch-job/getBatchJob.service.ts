import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { BatchJobConfigDto, SearchBatchJobConfigDto } from '@/types';
import axios from 'axios';

export async function getBatchJob(request: SearchBatchJobConfigDto): Promise<BatchJobConfigDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.SYS.BATCH_JOB.GET_BATCH_JOB);
	const resp = await axios.post<BatchJobConfigDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
