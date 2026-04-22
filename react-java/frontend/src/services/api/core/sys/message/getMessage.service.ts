import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { MessageDto, SearchMessageDto } from '@/types';
import axios from 'axios';

export async function getMessage(request: SearchMessageDto): Promise<MessageDto> {
	const url = getApiUrl(
		API_CONFIG.ENDPOINTS.SYS.MESSAGE_MANAGEMENT.GET_MESSAGE,
	);
	const resp = await axios.post<MessageDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}

