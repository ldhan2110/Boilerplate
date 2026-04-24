<script setup lang="ts">
const { t } = useI18n()
const userStore = useUserStore()

const isDark = computed(() => userStore.preferences.darkMode === 'dark')

function toggle() {
  userStore.updatePreference('darkMode', isDark.value ? 'light' : 'dark')
}
</script>

<template>
  <PButton
    severity="secondary"
    text
    rounded
    size="small"
    :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
    :title="isDark ? t('header.lightMode') : t('header.darkMode')"
    @click="toggle"
  />
</template>
