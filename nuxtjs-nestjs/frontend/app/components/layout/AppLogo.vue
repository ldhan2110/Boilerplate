<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex items-center gap-2">
    <i class="pi pi-prime text-xl" style="color: var(--p-primary-color)" />
    <span v-if="!collapsed" class="text-base font-semibold text-gray-900 dark:text-white truncate">
      {{ t('app.name') }}
    </span>
  </div>
</template>
