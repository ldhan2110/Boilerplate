import { onUnmounted } from 'vue'
import { apiClient } from '~/services'
import type { ErrorDto } from '~/types/api'

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: Record<string, any> | null
  headers?: Record<string, string>
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useApi<T>(url: string, options: UseApiOptions = {}) {
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<Error | null>(null)
  const loading = ref(false)
  let currentController: AbortController | null = null

  async function execute(overrideBody?: Record<string, any> | null): Promise<T | null> {
    currentController?.abort()
    const controller = new AbortController()
    currentController = controller

    loading.value = true
    error.value = null
    try {
      const method = options.method || 'GET'
      const fetchOptions: Parameters<typeof $fetch>[1] = {
        headers: options.headers,
        signal: controller.signal
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

      if (options.onSuccess) {
        options.onSuccess(result)
      }
      return result
    } catch (e: ErrorDto | any) {
      if (options.onError) {
        options.onError(e.response?._data || e)
      }
      if (e.name === 'AbortError') return null
      error.value = e
      return null
    } finally {
      if (currentController === controller) {
        loading.value = false
      }
    }
  }

  function abort() {
    currentController?.abort()
  }

  onUnmounted(() => abort())

  return { data, error, loading, execute, abort }
}
