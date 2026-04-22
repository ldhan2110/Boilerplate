// import { API_CONFIG, getApiUrl } from '@/configs';
// import { authService } from '@/services/auth/authJwtService';
// import type { GenerateReportDto } from '@/types';
// import axios, { type AxiosResponse } from 'axios';

// export async function generateReport(request: GenerateReportDto): Promise<Blob> {
//     const url = getApiUrl(API_CONFIG.ENDPOINTS.COM.REPORT.GENERATE_REPORT);
    
//     const response: AxiosResponse<Blob> = await axios.post<Blob>(url, request, {
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${authService.getAccessToken()}`,
//       },
//       responseType: 'blob',
//       withCredentials: true,
//     });
  
//     return response.data; // Axios returns data in response.data, not response.blob()
//   }
  