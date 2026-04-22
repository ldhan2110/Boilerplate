import axios from 'axios';
import { authService } from '../services/auth/authJwtService';

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9000/api',
});

// Request interceptor (e.g., add auth token)
api.interceptors.request.use(
	(config) => {
		const token = authService.getAccessToken();
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);
export default api;
