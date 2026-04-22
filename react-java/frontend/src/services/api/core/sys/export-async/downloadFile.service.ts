import { API_CONFIG, getApiUrl } from '@/configs';
import { authService } from '@/services/auth/authJwtService';
import axios, { type AxiosResponse } from 'axios';

/**
 * Download a file by fileId with optional range header support for partial content
 * @param fileId - The ID of the file to download
 * @param rangeHeader - Optional range header for partial content (e.g., "bytes=0-1023")
 * @returns Promise with the file blob and response headers
 */
export async function downloadFile(
    fileId: string,
    rangeHeader?: string,
    coId?: string
): Promise<{
    data: Blob;
    headers: Record<string, string>;
    status: number;
    fileName?: string;
}> {
    try {
        // Construct the download URL with fileId as path parameter
        const baseUrl = getApiUrl(`${API_CONFIG.ENDPOINTS.COM.FILE.DOWLOAD_FILE}/${fileId}`);
        const url = coId ? `${baseUrl}?coId=${encodeURIComponent(coId)}` : baseUrl;

        // Prepare headers
        const headers: Record<string, string> = {
            Authorization: `Bearer ${authService.getAccessToken()}`,
        };

        // Add range header if provided for partial content download
        if (rangeHeader && rangeHeader.trim()) {
            headers['Range'] = rangeHeader;
        }

        // Make the request with responseType 'blob' to handle binary data
        const response: AxiosResponse<Blob> = await axios.get(url, {
            headers,
            responseType: 'blob',
            withCredentials: true,
            // Don't throw on 206 Partial Content or 404 Not Found
            validateStatus: (status) => status === 200 || status === 206 || status === 404,
        });

        // Handle 404 Not Found
        if (response.status === 404) {
            throw new Error('File not found');
        }

        // Extract filename from Content-Disposition header if available
        let fileName: string | undefined;
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (fileNameMatch && fileNameMatch[1]) {
                fileName = fileNameMatch[1].replace(/['"]/g, '');
                // Decode if it's URL encoded
                if (fileName) {
                    try {
                        fileName = decodeURIComponent(fileName);
                    } catch (e) {
                        // Keep original if decode fails
                    }
                }
            }
        }

        return {
            data: response.data,
            headers: response.headers as Record<string, string>,
            status: response.status,
            fileName,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
                throw new Error('File not found');
            }
            throw new Error(`Failed to download file: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Download a file and trigger browser download
 * @param fileId - The ID of the file to download
 * @param customFileName - Optional custom filename for the download
 */
export async function downloadFileAndSave(fileId: string, customFileName?: string, coId?: string): Promise<void> {
    const { data, fileName } = await downloadFile(fileId, undefined, coId);

    // Create a blob URL and trigger download
    const blobUrl = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = customFileName || fileName || `file-${fileId}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the blob URL
    window.URL.revokeObjectURL(blobUrl);
}

/**
 * Download a file with range support for streaming/chunked downloads
 * Useful for large files or video/audio streaming
 * @param fileId - The ID of the file to download
 * @param start - Start byte position
 * @param end - End byte position (optional)
 */
export async function downloadFilePartial(
    fileId: string,
    start: number,
    end?: number,
    coId?: string
): Promise<{
    data: Blob;
    headers: Record<string, string>;
    status: number;
    fileName?: string;
}> {
    const rangeHeader = end !== undefined ? `bytes=${start}-${end}` : `bytes=${start}-`;
    return downloadFile(fileId, rangeHeader, coId);
}
