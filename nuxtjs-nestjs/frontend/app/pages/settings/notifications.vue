<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('sidebar.settingsNotifications') }}
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Notification preferences
      </p>
    </div>

    <PCard>
      <template #content>
        <div class="flex flex-col items-center py-8 text-center">
          <i class="pi pi-bell text-4xl text-gray-300 dark:text-gray-600 mb-4" />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Notification settings will be displayed here.
          </p>
        </div>
      </template>
    </PCard>
  </div>
</template>
