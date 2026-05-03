import type { MaybeRefOrGetter } from 'vue'
import type { SearchUserDto, UserInfoListDto, AppQueryExtras } from '~/types'
import { fetchUsersApi } from '~/services'
import { queryKeys } from '~/utils'

export function useLoadUsers(
  params: MaybeRefOrGetter<Record<string, any>>,
  options?: AppQueryExtras
) {
  return useAppQuery({
    queryKey: computed(() => queryKeys.administration.users.list(toValue(params))),
    queryFn: () => fetchUsersApi(toValue(params) as SearchUserDto),
    ...options,
  })
}
