import type { RoleDto, SuccessDto, AppMutationExtras } from '~/types'
import { insertRoleApi } from '~/services'
import { queryKeys } from '~/utils'

export function useInsertRole(
  options?: Omit<AppMutationExtras<SuccessDto, Error, RoleDto>, 'invalidateKeys'>
) {
  return useAppMutation({
    mutationFn: (dto: RoleDto) => insertRoleApi(dto),
    invalidateKeys: queryKeys.administration.roles.all,
    ...options,
  })
}
