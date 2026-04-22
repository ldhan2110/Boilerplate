import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { SuccessDto } from '@/types';
import axios from 'axios';

export async function resendEmails(emlIds: string[]): Promise<SuccessDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.SYS.EMAIL.RESEND_EMAILS);
	const resp = await axios.post<SuccessDto>(
		url,
		emlIds.map((emlId) => ({ emlId })),
		{
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${authService.getAccessToken()}`,
			},
			withCredentials: true,
		},
	);
	return resp.data;
}
