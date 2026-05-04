import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { QueryKey } from '@tanstack/vue-query'
import type { ErrorDto, AppMutationExtras } from '~/types'

export function useAppMutation<
  TData = unknown,
  TError = Error,
  TVariables = void
>(
  options: {
    mutationFn: (variables: TVariables) => Promise<TData>
    mutationKey?: QueryKey
    retry?: number | boolean
    retryDelay?: number
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void
  } & AppMutationExtras<TData, TError, TVariables>
) {
  const {
    successMessage,
    invalidateKeys,
    showSuccessToast = true,
    showErrorToast = true,
    onSuccess: customOnSuccess,
    onError: customOnError,
    ...mutationOptions
  } = options

  const toast = useAppToast()
  const { t } = useI18n()
  const queryClient = useQueryClient()

  return useMutation<TData, TError, TVariables>({
    ...(mutationOptions as any),
    onSuccess: (data: TData, variables: TVariables) => {
      if (showSuccessToast) {
        toast.showSuccess(successMessage ?? t('common.saveSuccess', 'Saved successfully'))
      }

      if (invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: invalidateKeys })
      }

      if (customOnSuccess) {
        customOnSuccess(data, variables)
        return
      }
    },
    onError: (error: TError, variables: TVariables) => {
      if (customOnError) {
        customOnError(error, variables)
        return
      }

      if (showErrorToast) {
        toast.showError(t(extractErrorMessage(error)))
      }
    }
  })
}

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const err = error as any
    const errorDto: ErrorDto | undefined = err.data ?? err.response?._data
    if (errorDto?.errorMessage) return errorDto.errorMessage
  }
  return 'common.internalError'
}
