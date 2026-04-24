<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('sidebar.dashboard') }}
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Welcome back, Admin
      </p>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <PCard>
        <template #content>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">1,234</p>
        </template>
      </PCard>
      <PCard>
        <template #content>
          <p class="text-sm text-gray-500 dark:text-gray-400">Active Now</p>
          <p class="text-2xl font-bold text-primary-500 mt-1">56</p>
        </template>
      </PCard>
      <PCard>
        <template #content>
          <p class="text-sm text-gray-500 dark:text-gray-400">Programs</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">12</p>
        </template>
      </PCard>
    </div>

    <!-- Placeholder content -->
    <PCard>
      <template #content>
        <p class="text-sm text-gray-500 dark:text-gray-400">Recent Activity</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-4">
          Activity feed will be displayed here.
        </p>
      </template>
    </PCard>
  </div>
</template>
