<script setup lang="ts">
const { t } = useI18n()
const layoutStore = useLayoutStore()
const route = useRoute()

const menuSections = computed(() => [
  {
    title: t('sidebar.main'),
    items: [
      { icon: 'i-lucide-layout-dashboard', label: t('sidebar.dashboard'), to: '/' },
      { icon: 'i-lucide-users', label: t('sidebar.users'), to: '/users' },
      { icon: 'i-lucide-settings', label: t('sidebar.settings'), to: '/settings' }
    ]
  },
  {
    title: t('sidebar.admin'),
    items: [
      { icon: 'i-lucide-shield', label: t('sidebar.roles'), to: '/roles' },
      { icon: 'i-lucide-clipboard-list', label: t('sidebar.programs'), to: '/programs' }
    ]
  }
])

function isActive(to: string) {
  return route.path === to
}
</script>

<template>
  <!-- Desktop sidebar -->
  <aside
    class="hidden lg:flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 h-screen sticky top-0"
    :class="layoutStore.sidebarCollapsed ? 'w-16' : 'w-60'"
  >
    <!-- Logo -->
    <div class="flex items-center h-14 px-3 border-b border-gray-200 dark:border-gray-800">
      <NuxtLink to="/" class="flex items-center">
        <AppLogo :collapsed="layoutStore.sidebarCollapsed" />
      </NuxtLink>
    </div>

    <!-- Menu -->
    <nav class="flex-1 overflow-y-auto p-2 space-y-4">
      <div v-for="section in menuSections" :key="section.title">
        <p
          v-if="!layoutStore.sidebarCollapsed"
          class="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
        >
          {{ section.title }}
        </p>
        <div v-else class="mb-1 border-b border-gray-200 dark:border-gray-800" />

        <NuxtLink
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="[
            isActive(item.to)
              ? 'bg-primary-500 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
            layoutStore.sidebarCollapsed ? 'justify-center' : ''
          ]"
          :title="layoutStore.sidebarCollapsed ? item.label : undefined"
        >
          <UIcon :name="item.icon" class="size-5 shrink-0" />
          <span v-if="!layoutStore.sidebarCollapsed">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Bottom user area -->
    <div class="border-t border-gray-200 dark:border-gray-800 p-3">
      <div
        class="flex items-center gap-2"
        :class="layoutStore.sidebarCollapsed ? 'justify-center' : ''"
      >
        <UAvatar
          src=""
          alt="Admin"
          :ui="{ fallback: 'bg-primary-500 text-white text-xs font-semibold' }"
          size="sm"
          text="A"
        />
        <div v-if="!layoutStore.sidebarCollapsed" class="min-w-0">
          <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">Admin User</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">admin@app.com</p>
        </div>
      </div>
    </div>
  </aside>

  <!-- Mobile sidebar overlay -->
  <USlideover
    v-model:open="layoutStore.sidebarMobileOpen"
    side="left"
    class="lg:hidden"
    :ui="{ width: 'max-w-64' }"
  >
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-800">
        <AppLogo />
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="layoutStore.closeMobileSidebar()"
        />
      </div>

      <!-- Menu -->
      <nav class="flex-1 overflow-y-auto p-2 space-y-4">
        <div v-for="section in menuSections" :key="section.title">
          <p class="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {{ section.title }}
          </p>
          <NuxtLink
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
            :class="isActive(item.to)
              ? 'bg-primary-500 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            @click="layoutStore.closeMobileSidebar()"
          >
            <UIcon :name="item.icon" class="size-5 shrink-0" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </div>
      </nav>

      <!-- Bottom user area -->
      <div class="border-t border-gray-200 dark:border-gray-800 p-3">
        <div class="flex items-center gap-2">
          <UAvatar
            src=""
            alt="Admin"
            :ui="{ fallback: 'bg-primary-500 text-white text-xs font-semibold' }"
            size="sm"
            text="A"
          />
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">Admin User</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">admin@app.com</p>
          </div>
        </div>
      </div>
    </div>
  </USlideover>
</template>
