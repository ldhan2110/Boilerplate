<script setup lang="ts">
const { t } = useI18n()
const colorMode = useColorMode()
const userStore = useUserStore()

function toggle() {
  const newMode = colorMode.value === 'dark' ? 'light' : 'dark'
  userStore.updatePreference('darkMode', newMode)
}
</script>

<template>
  <UButton
    color="neutral"
    variant="ghost"
    size="sm"
    :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
    :title="colorMode.value === 'dark' ? t('header.lightMode') : t('header.darkMode')"
    @click="toggle"
  />
</template>
