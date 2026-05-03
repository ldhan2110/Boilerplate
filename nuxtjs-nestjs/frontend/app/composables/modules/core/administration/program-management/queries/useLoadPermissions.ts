import type { SearchProgramDto, PermissionDto, AppQueryExtras } from '~/types'
import { fetchPermissionsByProgramApi } from '~/services'
import { queryKeys } from '~/utils'

export function useLoadPermissions(
  pgmId: Ref<string | undefined>,
  options?: AppQueryExtras
) {
  return useAppQuery({
    queryKey: computed(() => queryKeys.administration.programs.permissions(pgmId.value)),
    queryFn: () => fetchPermissionsByProgramApi({ pgmId: pgmId.value } as SearchProgramDto),
    enabled: computed(() => !!pgmId.value),
    ...options,
  })
}
