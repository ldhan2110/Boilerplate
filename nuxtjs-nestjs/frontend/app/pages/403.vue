<script lang="ts" setup>
definePageMeta({
  layout: 'default',
})

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] gap-6">
    <i class="pi pi-lock text-6xl text-surface-400" />
    <h1 class="text-2xl font-semibold text-surface-700 dark:text-surface-200">
      {{ t('error.forbidden') }}
    </h1>
    <p class="text-surface-500 dark:text-surface-400">
      {{ t('error.forbiddenMessage') }}
    </p>
    <CommonButtonsButton
      :label="t('common.backToHome')"
      icon="pi pi-arrow-left"
      variant="primary"
      outlined
      @click="navigateTo('/')"
    />
  </div>
</template>
