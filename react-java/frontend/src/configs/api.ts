import { authService } from '../services/auth/authJwtService';
import {
    ADM_ENDPOINTS,
    SYS_ENDPOINTS,
    COM_ENDPOINTS,
} from './modules';

/**
 * API Configuration with runtime support
 */
export const API_CONFIG = {
    get BASE_URL() {
        return import.meta.env.VITE_API_URL || 'http://localhost:9000/api';
    },
    ENDPOINTS: {
        INITIAL_STATE: '',
        ADM: ADM_ENDPOINTS,
        SYS: SYS_ENDPOINTS,
        COM: COM_ENDPOINTS,
    },
};

/**
 * Get API URL with optional path
 */
export const getApiUrl = (path?: string): string => {
    const baseUrl = API_CONFIG.BASE_URL;
    return path ? `${baseUrl}${path}` : baseUrl;
};

/**
 * Replace path parameters in URL
 */
export const replacePathParams = (url: string, params: Record<string, string>): string => {
    let result = url;
    Object.entries(params).forEach(([key, value]) => {
        result = result.replace(`{${key}}`, value);
    });
    return result;
};

export const getAccessToken = (): string | null => {
    return authService.getAccessToken();
};
