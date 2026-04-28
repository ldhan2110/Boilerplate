import { PureAbility } from '@casl/ability'
import { abilitiesPlugin } from '@casl/vue'
import { ROLE_PERMISSIONS } from '~/utils/constants'
import type { AppAbility } from '~/utils/constants'

export default defineNuxtPlugin((nuxtApp) => {
  const ability = new PureAbility<AppAbility extends PureAbility<infer R> ? R : never>([])
  nuxtApp.vueApp.use(abilitiesPlugin, ability, { useGlobalProperties: true })

  const userStore = useUserStore()

  watch(
    () => userStore.profile,
    (profile) => {
      const rules = profile?.roleNm
        ? ROLE_PERMISSIONS[profile.roleNm] ?? []
        : []
      ability.update(rules)
    },
    { immediate: true }
  )
})
