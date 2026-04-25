<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <div class="flex items-center gap-2.5">
    <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-sm">
      B
    </div>
    <span
      v-if="!collapsed"
      class="font-bold text-gray-900 dark:text-white truncate text-2xl"
    >
      {{ t('app.name') }}
    </span>
  </div>
</template>
