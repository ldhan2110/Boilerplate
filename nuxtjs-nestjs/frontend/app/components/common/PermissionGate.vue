<script lang="ts" setup>
import type { AbilityAction, AbilitySubject } from '~/utils/constants'

interface PermissionGateProps {
  action: AbilityAction
  subject: AbilitySubject
  behavior?: 'hide' | 'disable' | 'placeholder' | 'redirect'
  redirectTo?: string
}

const props = withDefaults(defineProps<PermissionGateProps>(), {
  behavior: 'hide',
  redirectTo: '/403',
})

const { hasPermission } = useAppPermission()

const permitted = computed(() => hasPermission(props.action, props.subject))

watch(
  permitted,
  (value) => {
    if (!value && props.behavior === 'redirect') {
      navigateTo(props.redirectTo)
    }
  },
  { immediate: true }
)
</script>

<template>
  <template v-if="permitted">
    <slot />
  </template>
  <template v-else-if="behavior === 'disable'">
    <div class="pointer-events-none opacity-50">
      <slot />
    </div>
  </template>
  <template v-else-if="behavior === 'placeholder'">
    <slot name="fallback" />
  </template>
  <!-- hide and redirect: render nothing -->
</template>
