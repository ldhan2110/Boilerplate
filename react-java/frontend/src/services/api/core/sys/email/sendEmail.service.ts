import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { SuccessDto } from '@/types';
import axios from 'axios';

export interface SendEmailParams {
	to: string;
	cc?: string;
	bcc?: string;
	subject?: string;
	htmlContent?: string;
	attachments?: File[];
}

export async function sendEmail(params: SendEmailParams): Promise<SuccessDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.SYS.EMAIL.SEND_EMAIL);

	const formData = new FormData();
	formData.append('to', params.to);
	if (params.cc) formData.append('cc', params.cc);
	if (params.bcc) formData.append('bcc', params.bcc);
	if (params.subject) formData.append('subject', params.subject);
	if (params.htmlContent) formData.append('htmlContent', params.htmlContent);
	if (params.attachments?.length) {
		params.attachments.forEach((file) => {
			formData.append('attachments', file);
		});
	}

	const resp = await axios.post<SuccessDto>(url, formData, {
		headers: {
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
		withCredentials: true,
	});
	return resp.data;
}
