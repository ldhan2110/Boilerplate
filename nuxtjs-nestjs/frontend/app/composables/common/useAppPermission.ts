import { useAbility } from '@casl/vue'
import type { AbilityAction, AbilitySubject } from '~/utils/constants'

export function useAppPermission() {
  const ability = useAbility()

  function hasPermission(action: AbilityAction, subject: AbilitySubject): boolean {
    return ability.can(action, subject)
  }

  return { ability, hasPermission }
}
