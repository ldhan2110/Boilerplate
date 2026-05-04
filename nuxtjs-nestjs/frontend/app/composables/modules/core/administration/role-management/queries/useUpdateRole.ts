import type { RoleDto, SuccessDto, AppMutationExtras } from '~/types'
import { updateRoleApi } from '~/services'
import { queryKeys } from '~/utils'

export function useUpdateRole(
  options?: Omit<AppMutationExtras<SuccessDto, Error, RoleDto>, 'invalidateKeys'>
) {
  return useAppMutation({
    mutationFn: (dto: RoleDto) => updateRoleApi(dto),
    invalidateKeys: queryKeys.administration.roles.all,
    ...options,
  })
}
