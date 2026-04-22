import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { MessageListDto, SearchMessageDto } from '@/types';
import axios from 'axios';

export async function getMessageHistoryList(request: SearchMessageDto): Promise<MessageListDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.SYS.ERROR_LOG.GET_MESSAGE_HISTORY_LIST);
	const resp = await axios.post<MessageListDto>(url, request, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}
