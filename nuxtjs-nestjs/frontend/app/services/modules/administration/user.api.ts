import { apiClient } from '~/services'
import { API_ENDPOINTS } from '~/utils'
import type { UserInfoListDto, SuccessDto, SearchUserDto, UserInfoDto } from '~/types'

export function fetchUsersApi(body: SearchUserDto) {
  return apiClient.post<UserInfoListDto>(API_ENDPOINTS.ADMINISTRATION.USERS.LIST, body)
}

export function saveUsersApi(users: UserInfoDto[]) {
  return apiClient.post<SuccessDto>(API_ENDPOINTS.ADMINISTRATION.USERS.SAVE, users)
}
