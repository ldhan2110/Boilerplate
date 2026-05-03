import type { ProgramDto, SuccessDto, AppMutationExtras } from '~/types'
import { updateProgramApi } from '~/services'
import { queryKeys } from '~/utils'

export function useUpdateProgram(
  options?: Omit<AppMutationExtras<SuccessDto, Error, ProgramDto>, 'invalidateKeys'>
) {
  return useAppMutation({
    mutationFn: (dto: ProgramDto) => updateProgramApi(dto),
    invalidateKeys: queryKeys.administration.programs.all,
    ...options,
  })
}
