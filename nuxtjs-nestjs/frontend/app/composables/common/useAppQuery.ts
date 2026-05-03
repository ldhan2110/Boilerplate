import { useQuery } from '@tanstack/vue-query'
import type { QueryKey } from '@tanstack/vue-query'
import type { ErrorDto, AppQueryExtras } from '~/types'

export function useAppQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  options: {
    queryKey: TQueryKey | (() => TQueryKey) | Ref<TQueryKey> | ComputedRef<TQueryKey>
    queryFn: () => Promise<TQueryFnData>
    enabled?: boolean | Ref<boolean>
    select?: (data: TQueryFnData) => TData
    staleTime?: number
    gcTime?: number
    refetchOnWindowFocus?: boolean
    refetchOnMount?: boolean
    retry?: number | boolean
    retryDelay?: number
    placeholderData?: TQueryFnData | (() => TQueryFnData | undefined)
  } & AppQueryExtras
) {
  const {
    showErrorToast = true,
    errorMessage: customErrorMessage,
    onError,
    ...queryOptions
  } = options

  const toast = useAppToast()
  const { t } = useI18n()
  const query = useQuery(queryOptions as any)

  if (showErrorToast || onError) {
    watch(query.error, (err) => {
      if (!err) return

      if (showErrorToast) {
        const message = customErrorMessage ?? extractErrorMessage(err)
        toast.showError(t(message))
      }

      onError?.(err)
    })
  }

  return query
}

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const err = error as any
    const errorDto: ErrorDto | undefined = err.data ?? err.response?._data
    if (errorDto?.errorMessage) return errorDto.errorMessage;
  }
  return 'common.internalError';
}
