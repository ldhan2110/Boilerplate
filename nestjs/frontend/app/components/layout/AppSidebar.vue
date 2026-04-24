<script setup lang="ts">
import { resolveMenuIcon } from '~/utils/constants/menuIcons'
import menuData from '~/data/menu.json'

const { t } = useI18n()
const layoutStore = useLayoutStore()
const route = useRoute()
const userStore = useUserStore()

const menuSections = computed(() =>
  menuData.map(section => ({
    items: section.items.map(item => ({
      ...item,
      label: t(item.label)
    }))
  }))
)

function isActive(to?: string) {
  return to ? route.path === to : false
}
</script>

<template>
  <!-- Desktop sidebar -->
  <aside
    class="hidden lg:flex flex-col shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 h-screen sticky top-0"
    :class="layoutStore.sidebarCollapsed ? 'w-[4.5rem]' : 'w-64'"
  >
    <!-- Logo area -->
    <div class="flex items-center justify-between h-14 px-3 border-b border-gray-200 dark:border-gray-800">
      <NuxtLink to="/" class="flex items-center">
        <AppLogo :collapsed="layoutStore.sidebarCollapsed" />
      </NuxtLink>
    </div>

    <!-- Menu -->
    <nav class="flex-1 overflow-y-auto px-3 py-4">
      <div v-for="(section, sIdx) in menuSections" :key="section.title" :class="sIdx > 0 ? 'mt-6' : ''">
        <p
          v-if="!layoutStore.sidebarCollapsed"
          class="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none"
        >
          {{ section.title }}
        </p>
        <div v-else class="mb-2 mx-2 border-b border-gray-200 dark:border-gray-800" />

        <ul class="flex flex-col gap-1">
          <li v-for="item in section.items" :key="item.id">
            <NuxtLink
              :to="item.to || '/'"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              :class="[
                isActive(item.to)
                  ? 'sidebar-item-active shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
                layoutStore.sidebarCollapsed ? 'justify-center px-0' : ''
              ]"
              :title="layoutStore.sidebarCollapsed ? item.label : undefined"
            >
              <i
                :class="resolveMenuIcon(item.icon)"
                class="text-lg shrink-0 w-5 text-center"
              />
              <span v-if="!layoutStore.sidebarCollapsed" class="truncate">{{ item.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Collapse toggle -->
    <div class="border-t border-gray-200 dark:border-gray-800 p-2">
      <button
        class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        @click="layoutStore.toggleSidebar()"
      >
        <i :class="layoutStore.sidebarCollapsed ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'" class="text-base" />
        <span v-if="!layoutStore.sidebarCollapsed" class="text-xs font-medium">Collapse</span>
      </button>
    </div>
  </aside>

  <!-- Mobile sidebar overlay -->
  <PDrawer
    v-model:visible="layoutStore.sidebarMobileOpen"
    position="left"
    class="lg:hidden"
    :style="{ width: '18rem' }"
    :modal="true"
  >
    <template #header>
      <AppLogo />
    </template>

    <nav class="px-2 py-2">
      <div v-for="(section, sIdx) in menuSections" :key="section.title" :class="sIdx > 0 ? 'mt-5' : ''">
        <p class="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none">
          {{ section.title }}
        </p>
        <ul class="flex flex-col gap-1">
          <li v-for="item in section.items" :key="item.id">
            <NuxtLink
              :to="item.to || '/'"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              :class="isActive(item.to)
                ? 'sidebar-item-active shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'"
              @click="layoutStore.closeMobileSidebar()"
            >
              <i :class="resolveMenuIcon(item.icon)" class="text-lg shrink-0 w-5 text-center" />
              <span class="truncate">{{ item.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>
  </PDrawer>
</template>
