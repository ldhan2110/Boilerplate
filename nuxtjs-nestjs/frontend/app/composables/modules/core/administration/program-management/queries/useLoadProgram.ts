import type { SearchProgramDto, AppQueryExtras } from '~/types'
import { fetchProgramApi } from '~/services'
import { queryKeys } from '~/utils'

export function useLoadProgram(
  pgmId: Ref<string | undefined>,
  options?: AppQueryExtras
) {
  return useAppQuery({
    queryKey: computed(() => queryKeys.administration.programs.detail(pgmId.value)),
    queryFn: () => fetchProgramApi({ pgmId: pgmId.value } as SearchProgramDto),
    enabled: computed(() => !!pgmId.value),
    ...options,
  })
}
