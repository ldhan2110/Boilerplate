import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { SuccessDto } from '@/types';
import axios from 'axios';

export async function removeFavorite(pgmCd: string): Promise<SuccessDto> {
	const url = getApiUrl(`${API_CONFIG.ENDPOINTS.SYS.FAVORITES.REMOVE_FAVORITE}/${pgmCd}`);
	const resp = await axios.delete<SuccessDto>(url, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}

