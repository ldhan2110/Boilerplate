<script setup lang="ts">
const { t } = useI18n()
const notificationStore = useNotificationStore()
const open = ref(false)
</script>

<template>
  <UPopover v-model:open="open">
    <UButton
      color="neutral"
      variant="ghost"
      size="sm"
      icon="i-lucide-bell"
    >
      <template #trailing>
        <UBadge
          v-if="notificationStore.unreadCount > 0"
          :label="notificationStore.unreadCount"
          size="xs"
          color="red"
          class="absolute -top-1 -right-1 size-5 justify-center rounded-full p-0"
        />
      </template>
    </UButton>

    <template #content>
      <div class="w-80">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <span class="text-sm font-semibold">{{ t('header.notifications') }}</span>
          <UButton
            v-if="notificationStore.unreadCount > 0"
            :label="t('header.markAllRead')"
            variant="link"
            size="xs"
            @click="notificationStore.markAllRead()"
          />
        </div>

        <!-- List -->
        <div class="max-h-64 overflow-y-auto">
          <div
            v-for="notification in notificationStore.notifications"
            :key="notification.id"
            class="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            :class="{ 'opacity-60': notification.read }"
            @click="notificationStore.markRead(notification.id)"
          >
            <UIcon :name="notification.icon" class="size-5 text-primary-500 mt-0.5 shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="text-sm text-gray-900 dark:text-white">{{ notification.message }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ notification.time }}</p>
            </div>
            <div
              v-if="!notification.read"
              class="size-2 bg-primary-500 rounded-full mt-2 shrink-0"
            />
          </div>

          <div
            v-if="notificationStore.notifications.length === 0"
            class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            {{ t('header.noNotifications') }}
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-gray-200 dark:border-gray-800 px-4 py-2">
          <UButton
            :label="t('header.viewAll')"
            variant="link"
            size="sm"
            block
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
