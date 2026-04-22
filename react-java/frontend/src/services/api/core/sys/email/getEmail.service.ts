import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import axios from 'axios';

export interface EmailAttachmentDetailDto {
	emlAtchId: string;
	fileId: string;
	fileNm: string;
	fileTp: string;
	fileSz: number;
	dspOrdVal: number;
}

export interface EmailDetailDto {
	emlId: string;
	emlTo: string;
	emlCc: string;
	emlBcc: string;
	emlSubjVal: string;
	emlCntnVal: string;
	emlSndStsCd: string;
	emlSysMsg: string;
	emlAtchId: string;
	creUsrId: string;
	creDt: string;
	attachments: EmailAttachmentDetailDto[];
}

export async function getEmail(request: { coId?: string; emlId: string }): Promise<EmailDetailDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.SYS.EMAIL.GET_EMAIL);
	const resp = await axios.post<EmailDetailDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
