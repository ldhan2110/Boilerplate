import type { MaybeRefOrGetter } from 'vue'
import type { SearchRoleDto, RoleListDto, AppQueryExtras } from '~/types'
import { fetchRoleListApi } from '~/services'
import { queryKeys } from '~/utils'

export function useLoadRoles(
  params: MaybeRefOrGetter<Record<string, any>>,
  options?: AppQueryExtras
) {
  return useAppQuery({
    queryKey: computed(() => queryKeys.administration.roles.list(toValue(params))),
    queryFn: () => fetchRoleListApi(toValue(params) as SearchRoleDto),
    ...options,
  })
}
