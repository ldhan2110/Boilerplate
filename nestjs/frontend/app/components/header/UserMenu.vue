<script setup lang="ts">
const { t } = useI18n()

const items = computed(() => [
  {
    label: t('header.profile'),
    icon: 'i-lucide-user',
    click: () => {}
  },
  {
    label: t('header.settings'),
    icon: 'i-lucide-settings',
    click: () => {}
  },
  {
    label: t('header.logout'),
    icon: 'i-lucide-log-out',
    click: () => {}
  }
])
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton color="neutral" variant="ghost" size="sm" class="gap-2">
      <UAvatar
        src=""
        alt="Admin"
        :ui="{ fallback: 'bg-primary-500 text-white text-xs font-semibold' }"
        size="xs"
        text="A"
      />
      <span class="hidden md:inline text-sm font-medium">Admin</span>
    </UButton>
  </UDropdownMenu>
</template>
