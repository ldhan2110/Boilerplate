<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
const userStore = useUserStore()

const currentLocale = computed(() =>
  (locales.value as any[]).find((l: any) => l.code === locale.value)
)

const localeItems = computed(() =>
  (locales.value as any[]).map(l => ({
    label: l.name,
    onSelect: () => {
      setLocale(l.code)
      userStore.updatePreference('locale', l.code)
    }
  }))
)
</script>

<template>
  <UDropdownMenu :items="localeItems">
    <UButton
      color="neutral"
      variant="ghost"
      size="sm"
      :label="currentLocale?.code?.toUpperCase()"
      icon="i-lucide-globe"
      trailing-icon="i-lucide-chevron-down"
    />
  </UDropdownMenu>
</template>
