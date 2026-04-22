import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { Favorite } from '@/types';
import axios from 'axios';

export async function getFavorites(): Promise<Favorite[]> {
	const url = getApiUrl(API_CONFIG.ENDPOINTS.SYS.FAVORITES.GET_FAVORITES);
	const resp = await axios.get<Favorite[]>(url, {
		headers: {
			withCredentials: true,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authService.getAccessToken()}`,
		},
	});
	return resp.data;
}

