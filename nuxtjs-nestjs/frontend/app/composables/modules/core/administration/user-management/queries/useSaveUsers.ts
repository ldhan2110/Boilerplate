import type { UserInfoDto, SuccessDto, AppMutationExtras } from '~/types'
import { saveUsersApi } from '~/services'
import { queryKeys } from '~/utils'

export function useSaveUsers(
  options?: Omit<AppMutationExtras<SuccessDto, Error, UserInfoDto[]>, 'invalidateKeys'>
) {
  return useAppMutation({
    mutationFn: (users: UserInfoDto[]) => saveUsersApi(users),
    invalidateKeys: queryKeys.administration.users.all,
    ...options,
  })
}
