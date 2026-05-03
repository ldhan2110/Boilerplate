import type { PermissionDto, SuccessDto, AppMutationExtras } from '~/types'
import { savePermissionsByProgramApi } from '~/services'
import { queryKeys } from '~/utils'

export function useSavePermissions(
  options?: Omit<AppMutationExtras<SuccessDto, Error, PermissionDto[]>, 'invalidateKeys'>
) {
  return useAppMutation({
    mutationFn: (list: PermissionDto[]) => savePermissionsByProgramApi(list),
    invalidateKeys: queryKeys.administration.programs.all,
    ...options,
  })
}
