import { apiClient } from '~/services'

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: Record<string, any> | null
  headers?: Record<string, string>
  immediate?: boolean
}

export function useApi<T>(url: string, options: UseApiOptions = {}) {
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<Error | null>(null)
  const loading = ref(false)

  async function execute(overrideBody?: Record<string, any> | null): Promise<T | null> {
    loading.value = true
    error.value = null
    try {
      const method = options.method || 'GET'
      const fetchOptions: Parameters<typeof $fetch>[1] = {
        headers: options.headers
      }
      const body = overrideBody !== undefined ? overrideBody : options.body

      let result: T
      switch (method) {
        case 'POST':
          result = await apiClient.post<T>(url, body, fetchOptions)
          break
        case 'PUT':
          result = await apiClient.put<T>(url, body, fetchOptions)
          break
        case 'PATCH':
          result = await apiClient.patch<T>(url, body, fetchOptions)
          break
        case 'DELETE':
          result = await apiClient.delete<T>(url, fetchOptions)
          break
        default:
          result = await apiClient.get<T>(url, fetchOptions)
      }

      data.value = result
      return result
    } catch (e: any) {
      error.value = e
      return null
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, execute }
}
