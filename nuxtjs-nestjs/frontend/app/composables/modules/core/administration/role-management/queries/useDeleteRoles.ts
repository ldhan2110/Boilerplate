import type { RoleDto, SuccessDto, AppMutationExtras } from '~/types'
import { deleteRolesApi } from '~/services'
import { queryKeys } from '~/utils'

export function useDeleteRoles(
  options?: Omit<AppMutationExtras<SuccessDto, Error, RoleDto[]>, 'invalidateKeys'>
) {
  return useAppMutation({
    mutationFn: (list: RoleDto[]) => deleteRolesApi(list),
    invalidateKeys: queryKeys.administration.roles.all,
    ...options,
  })
}
