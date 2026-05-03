import type { ProgramDto, SuccessDto, AppMutationExtras } from '~/types'
import { deleteProgramsApi } from '~/services'
import { queryKeys } from '~/utils'

export function useDeletePrograms(
  options?: Omit<AppMutationExtras<SuccessDto, Error, ProgramDto[]>, 'invalidateKeys'>
) {
  return useAppMutation({
    mutationFn: (list: ProgramDto[]) => deleteProgramsApi(list),
    invalidateKeys: queryKeys.administration.programs.all,
    ...options,
  })
}
