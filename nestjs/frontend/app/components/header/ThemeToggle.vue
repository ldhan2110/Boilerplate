<script setup lang="ts">
const { t } = useI18n()
const colorMode = useColorMode()

function toggle() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
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
