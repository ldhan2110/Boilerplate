import type { PermissionDto, AppQueryExtras } from '~/types'
import { fetchAllPermissionsApi } from '~/services'
import { queryKeys } from '~/utils'

export function useLoadAllPermissions(options?: AppQueryExtras) {
  return useAppQuery({
    queryKey: queryKeys.administration.programs.allPermissions(),
    queryFn: () => fetchAllPermissionsApi(),
    ...options,
  })
}
