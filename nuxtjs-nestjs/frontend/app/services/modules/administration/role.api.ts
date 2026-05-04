import { apiClient } from '~/services'
import { API_ENDPOINTS } from '~/utils'
import type {
  RoleListDto,
  RoleDto,
  SearchRoleDto,
  SuccessDto,
} from '~/types'

export function fetchRoleListApi(body: SearchRoleDto) {
  return apiClient.post<RoleListDto>(API_ENDPOINTS.ADMINISTRATION.ROLES.LIST, body)
}

export function fetchRoleApi(body: SearchRoleDto) {
  return apiClient.post<RoleDto>(API_ENDPOINTS.ADMINISTRATION.ROLES.GET, body)
}

export function insertRoleApi(body: RoleDto) {
  return apiClient.post<SuccessDto>(API_ENDPOINTS.ADMINISTRATION.ROLES.INSERT, body)
}

export function updateRoleApi(body: RoleDto) {
  return apiClient.post<SuccessDto>(API_ENDPOINTS.ADMINISTRATION.ROLES.UPDATE, body)
}

export function deleteRolesApi(body: RoleDto[]) {
  return apiClient.post<SuccessDto>(API_ENDPOINTS.ADMINISTRATION.ROLES.DELETE, body)
}
