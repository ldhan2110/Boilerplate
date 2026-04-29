
import type { ErrorDto } from '~/types/api'

let _baseURL: string | null = null

function getBaseURL(): string {
  if (!_baseURL) {
    const config = useRuntimeConfig()
    _baseURL = config.public.apiBase as string
  }
  return _baseURL
}

function getAccessToken(): string | null {
  const userStore = useUserStore()
  return userStore.accessToken
}

async function request<T>(url: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    return await $fetch<T>(url, {
      baseURL: getBaseURL(),
      ...options,
      headers
    })
  } catch (error: any) {
    if (error?.statusCode === 401 && token) {
      const userStore = useUserStore()
      const refreshed = await userStore.refreshTokens()
      if (refreshed) {
        headers.Authorization = `Bearer ${userStore.accessToken}`
        return await $fetch<T>(url, {
          baseURL: getBaseURL(),
          ...options,
          headers
        })
      }
      await userStore.logout()
      navigateTo('/login')
    }
    throw error
  }
}

export const apiClient = {
  get: <T>(url: string, options?: Parameters<typeof $fetch>[1]) =>
    request<T>(url, { ...options, method: 'GET' }),

  post: <T>(url: string, body?: Record<string, any> | null, options?: Parameters<typeof $fetch>[1]) =>
    request<T>(url, { ...options, method: 'POST', body }),

  put: <T>(url: string, body?: Record<string, any> | null, options?: Parameters<typeof $fetch>[1]) =>
    request<T>(url, { ...options, method: 'PUT', body }),

  patch: <T>(url: string, body?: Record<string, any> | null, options?: Parameters<typeof $fetch>[1]) =>
    request<T>(url, { ...options, method: 'PATCH', body }),

  delete: <T>(url: string, options?: Parameters<typeof $fetch>[1]) =>
    request<T>(url, { ...options, method: 'DELETE' })
}
