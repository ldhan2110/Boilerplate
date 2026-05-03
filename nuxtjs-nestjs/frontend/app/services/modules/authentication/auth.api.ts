import { apiClient } from '~/services/apiClient'
import { API_ENDPOINTS } from '~/utils/constants/queryKey'
import type { LoginRequestDto, LoginResponseDto, UserMeResponse } from '~/types'

export function loginApi(request: LoginRequestDto) {
  return apiClient.post<LoginResponseDto>(API_ENDPOINTS.AUTH.LOGIN, request)
}

export function logoutApi() {
  return apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
}

export function refreshTokenApi(refreshToken: string) {
  return apiClient.post<LoginResponseDto>(API_ENDPOINTS.AUTH.REFRESH, { refreshToken })
}

export function fetchProfileApi() {
  return apiClient.get<UserMeResponse>(API_ENDPOINTS.AUTH.PROFILE)
}

export function updatePreferencesApi(prefs: {
  langVal: string
  sysModVal: string
  sysColrVal: string
  dtFmtVal: string
}) {
  return apiClient.patch(API_ENDPOINTS.AUTH.PREFERENCES, prefs)
}
