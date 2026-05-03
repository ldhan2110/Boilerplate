import type { ProgramDto, SuccessDto, AppMutationExtras } from '~/types'
import { insertProgramApi } from '~/services'
import { queryKeys } from '~/utils'

export function useInsertProgram(
  options?: Omit<AppMutationExtras<SuccessDto, Error, ProgramDto>, 'invalidateKeys'>
) {
  return useAppMutation({
    mutationFn: (dto: ProgramDto) => insertProgramApi(dto),
    invalidateKeys: queryKeys.administration.programs.all,
    ...options,
  })
}
