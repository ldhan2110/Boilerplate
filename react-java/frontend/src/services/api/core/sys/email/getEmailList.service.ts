import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import axios from 'axios';

export interface SearchEmailParams {
	coId?: string;
	fromDate?: string;
	toDate?: string;
	emlSndStsCd?: string;
	emlTo?: string;
	emlSubjVal?: string;
	sort?: { sortField?: string; sortType?: string };
	pagination?: { pageSize: number; current: number };
}

export interface EmailListDto {
	emlId: string;
	emlTo: string;
	emlCc: string;
	emlBcc: string;
	emlSubjVal: string;
	emlSndStsCd: string;
	emlSysMsg: string;
	emlAtchId: string;
	creUsrId: string;
	creDt: string;
}

export interface EmailListResultDto {
	emails: EmailListDto[];
	total: number;
}

export async function getEmailList(request: SearchEmailParams): Promise<EmailListResultDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.SYS.EMAIL.GET_EMAIL_LIST);
	const resp = await axios.post<EmailListResultDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
