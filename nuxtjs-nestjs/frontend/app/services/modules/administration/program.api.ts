import { apiClient } from '~/services'
import { API_ENDPOINTS } from '~/utils'
import type {
  ProgramListDto,
  ProgramDto,
  PermissionDto,
  SearchProgramDto,
  SuccessDto,
} from '~/types'

export function fetchProgramListApi(body: SearchProgramDto) {
  return apiClient.post<ProgramListDto>(API_ENDPOINTS.ADMINISTRATION.PROGRAMS.LIST, body)
}

export function fetchProgramApi(body: SearchProgramDto) {
  return apiClient.post<ProgramDto | null>(API_ENDPOINTS.ADMINISTRATION.PROGRAMS.GET, body)
}

export function insertProgramApi(body: ProgramDto) {
  return apiClient.post<SuccessDto>(API_ENDPOINTS.ADMINISTRATION.PROGRAMS.INSERT, body)
}

export function updateProgramApi(body: ProgramDto) {
  return apiClient.post<SuccessDto>(API_ENDPOINTS.ADMINISTRATION.PROGRAMS.UPDATE, body)
}

export function deleteProgramsApi(body: ProgramDto[]) {
  return apiClient.post<SuccessDto>(API_ENDPOINTS.ADMINISTRATION.PROGRAMS.DELETE, body)
}

export function fetchPermissionsByProgramApi(body: SearchProgramDto) {
  return apiClient.post<PermissionDto[]>(API_ENDPOINTS.ADMINISTRATION.PROGRAMS.GET_PERMISSIONS, body)
}

export function savePermissionsByProgramApi(body: PermissionDto[]) {
  return apiClient.post<SuccessDto>(API_ENDPOINTS.ADMINISTRATION.PROGRAMS.SAVE_PERMISSIONS, body)
}
