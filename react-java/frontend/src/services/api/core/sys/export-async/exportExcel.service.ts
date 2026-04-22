import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import type { ExcelExportResultDto } from '@/types';
import axios, { type AxiosResponse } from 'axios';

/**
 * Export data to Excel
 * @param request - Search criteria for data to export
 * @returns Promise with export result (either immediate file or job info)
 */
export async function exportExcel<TRequest = any>(
	request: TRequest,
	pathParams?: string,
): Promise<ExcelExportResultDto> {
	try {
		const path = pathParams ? pathParams : API_CONFIG.ENDPOINTS.ADM.USER.EXPORT_EXCEL;
		const url = getApiUrl(path);

		// Make the request with responseType 'blob' to handle binary data
		// The backend will return either:
		// 1. Binary file data (immediate download)
		// 2. JSON response (async export)
		const response: AxiosResponse = await axios.post(url, request, {
			headers: {
				withCredentials: true,
				'Content-Type': 'application/json',
				Authorization: `Bearer ${authService.getAccessToken()}`,
			},
			responseType: 'blob', // Handle binary response
		});

		// Check if response is JSON (async export) or binary (immediate download)
		const contentType = response.headers['content-type'];
		const isJson = contentType && contentType.includes('application/json');

		if (isJson) {
			// Async export - parse JSON response
			const text = await response.data.text();
			const jsonResult = JSON.parse(text);
			return {
				immediate: false,
				taskId: jsonResult.taskId,
				message: jsonResult.message,
			};
		} else {
			// Immediate download - extract filename and return blob
			let fileName = 'users_export.xlsx';
			const contentDisposition = response.headers['content-disposition'];

			if (contentDisposition) {
				const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
				if (fileNameMatch && fileNameMatch[1]) {
					fileName = fileNameMatch[1].replace(/['"]/g, '');
					// Decode if it's URL encoded
					try {
						fileName = decodeURIComponent(fileName);
					} catch (e) {
						// Keep original if decode fails
					}
				}
			}

			return {
				immediate: true,
				fileName,
				fileData: response.data,
			};
		}
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw new Error(`Failed to export Excel: ${error.message}`);
		}
		throw error;
	}
}
