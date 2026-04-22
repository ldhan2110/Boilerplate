import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { SuccessDto } from '@/types';
import axios from 'axios';

export async function addFavorite(pgmCd: string): Promise<SuccessDto> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.SYS.FAVORITES.ADD_FAVORITE);
	const resp = await axios.post<SuccessDto>(
		url,
		{ pgmCd },
		{
			headers: {
				withCredentials: true,
				'Content-Type': 'application/json',
				Authorization: `Bearer ${authService.getAccessToken()}`,
			},
		},
	);
	return resp.data;
}

