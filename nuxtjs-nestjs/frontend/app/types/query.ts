
import type { QueryKey } from '@tanstack/vue-query'

export interface AppQueryExtras {
  showErrorToast?: boolean
  errorMessage?: string
  enabled?: boolean | Ref<boolean>
  select?: (data: any) => any
  onError?: (error: unknown) => void
}


export interface AppMutationExtras<TData, TError, TVariables> {
  successMessage?: string
  invalidateKeys?: QueryKey
  showSuccessToast?: boolean
  showErrorToast?: boolean
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: TError, variables: TVariables) => void
}
