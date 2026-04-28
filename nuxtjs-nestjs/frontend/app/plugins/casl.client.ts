import { PureAbility } from '@casl/ability'
import { abilitiesPlugin } from '@casl/vue'
import { ROLE_PERMISSIONS } from '~/utils/constants'
import type { AbilityAction, AbilitySubject } from '~/utils/constants'

export default defineNuxtPlugin((nuxtApp) => {
  const ability = new PureAbility<[AbilityAction, AbilitySubject]>([])
  nuxtApp.vueApp.use(abilitiesPlugin, ability, { useGlobalProperties: true })

  const userStore = useUserStore()

  watch(
    () => userStore.profile,
    (profile) => {
      const tuples = profile?.roleNm
        ? ROLE_PERMISSIONS[profile.roleNm] ?? []
        : []
      ability.update(tuples.map(([action, subject]) => ({ action, subject })))
    },
    { immediate: true }
  )
})
