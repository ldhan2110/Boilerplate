import type { SearchRoleDto, RoleDto, AppQueryExtras } from '~/types'
import { fetchRoleApi } from '~/services'
import { queryKeys } from '~/utils'

export function useGetRole(
  roleId: Ref<string | undefined>,
  options?: AppQueryExtras
) {
  return useAppQuery({
    queryKey: computed(() => queryKeys.administration.roles.detail(roleId.value)),
    queryFn: () => fetchRoleApi({ roleId: roleId.value } as SearchRoleDto),
    enabled: computed(() => !!roleId.value),
    ...options,
  })
}
