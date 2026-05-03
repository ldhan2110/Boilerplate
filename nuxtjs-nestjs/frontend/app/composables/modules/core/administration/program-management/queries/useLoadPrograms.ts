import type { MaybeRefOrGetter } from 'vue'
import type { SearchProgramDto, ProgramListDto, AppQueryExtras } from '~/types'
import { fetchProgramListApi } from '~/services'
import { queryKeys } from '~/utils'

export function useLoadPrograms(
  params: MaybeRefOrGetter<Record<string, any>>,
  options?: AppQueryExtras
) {
  return useAppQuery({
    queryKey: computed(() => queryKeys.administration.programs.list(toValue(params))),
    queryFn: () => fetchProgramListApi(toValue(params) as SearchProgramDto),
    ...options,
  })
}
