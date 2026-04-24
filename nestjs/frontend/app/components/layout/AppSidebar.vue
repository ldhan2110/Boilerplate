<script setup lang="ts">
import { resolveMenuIcon } from '~/utils/constants/menuIcons'
import menuData from '~/data/menu.json'

interface MenuItem {
  id: string
  label: string
  icon?: string
  to?: string
  children?: { id: string; label: string; to: string }[]
}

const { t } = useI18n()
const layoutStore = useLayoutStore()
const route = useRoute()

const expandedMenus = ref<Set<string>>(new Set())
const hoveredItem = ref<string | null>(null)
let hoverTimeout: ReturnType<typeof setTimeout> | null = null

const menuItems = computed(() =>
  (menuData as MenuItem[]).map(item => ({
    ...item,
    label: t(item.label),
    children: item.children?.map(child => ({
      ...child,
      label: t(child.label)
    }))
  }))
)

function isActive(to?: string) {
  return to ? route.path === to : false
}

function isParentActive(item: MenuItem) {
  return item.children?.some(child => route.path === child.to) ?? false
}

function toggleMenu(id: string) {
  if (expandedMenus.value.has(id)) {
    expandedMenus.value.delete(id)
  } else {
    expandedMenus.value.add(id)
  }
}

function isExpanded(id: string) {
  return expandedMenus.value.has(id)
}

function onIconMouseEnter(id: string) {
  if (hoverTimeout) clearTimeout(hoverTimeout)
  hoveredItem.value = id
}

function onIconMouseLeave() {
  hoverTimeout = setTimeout(() => {
    hoveredItem.value = null
  }, 200)
}

function onPanelMouseEnter() {
  if (hoverTimeout) clearTimeout(hoverTimeout)
}

function onPanelMouseLeave() {
  hoveredItem.value = null
}

// Auto-expand parent menus when a child route is active
watchEffect(() => {
  for (const item of menuData as MenuItem[]) {
    if (item.children?.some(child => route.path === child.to)) {
      expandedMenus.value.add(item.id)
    }
  }
})
</script>

<template>
  <!-- Desktop sidebar -->
  <aside
    class="hidden lg:flex flex-col shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 overflow-visible"
    :class="layoutStore.sidebarCollapsed ? 'w-14' : 'w-56'"
  >
    <!-- Expanded menu -->
    <nav v-if="!layoutStore.sidebarCollapsed" class="flex-1 overflow-y-auto px-3 py-4">
      <ul class="flex flex-col gap-1">
        <li v-for="item in menuItems" :key="item.id">
          <!-- Parent with children -->
          <template v-if="item.children?.length">
            <button
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              :class="isParentActive(item as MenuItem)
                ? 'sidebar-item-active shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'"
              @click="toggleMenu(item.id)"
            >
              <i :class="resolveMenuIcon(item.icon)" class="text-lg shrink-0 w-5 text-center" />
              <span class="truncate flex-1 text-left">{{ item.label }}</span>
              <i
                class="pi text-xs transition-transform duration-200"
                :class="isExpanded(item.id) ? 'pi-chevron-down' : 'pi-chevron-right'"
              />
            </button>

            <!-- Children -->
            <ul v-if="isExpanded(item.id)" class="mt-1 ml-5 pl-3 border-l border-gray-200 dark:border-gray-700 flex flex-col gap-1">
              <li v-for="child in item.children" :key="child.id">
                <NuxtLink
                  :to="child.to"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200"
                  :class="isActive(child.to)
                    ? 'sidebar-item-active shadow-sm font-medium'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'"
                >
                  <span class="truncate">{{ child.label }}</span>
                </NuxtLink>
              </li>
            </ul>
          </template>

          <!-- Simple link (no children) -->
          <NuxtLink
            v-else
            :to="item.to || '/'"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            :class="isActive(item.to)
              ? 'sidebar-item-active shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'"
          >
            <i :class="resolveMenuIcon(item.icon)" class="text-lg shrink-0 w-5 text-center" />
            <span class="truncate">{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- Collapsed icon rail -->
    <nav v-else class="flex-1 overflow-visible py-4 flex flex-col items-center gap-1 relative">
      <div
        v-for="item in menuItems"
        :key="item.id"
        class="relative"
        @mouseenter="onIconMouseEnter(item.id)"
        @mouseleave="onIconMouseLeave()"
      >
        <!-- Icon button — simple link (no children) -->
        <NuxtLink
          v-if="!item.children?.length"
          :to="item.to || '/'"
          class="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200"
          :class="isActive(item.to)
            ? 'sidebar-item-active shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'"
          v-tooltip.right="item.label"
        >
          <i :class="resolveMenuIcon(item.icon)" class="text-lg" />
        </NuxtLink>

        <!-- Icon button — has children -->
        <button
          v-else
          class="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200"
          :class="isParentActive(item as MenuItem)
            ? 'sidebar-item-active shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'"
        >
          <i :class="resolveMenuIcon(item.icon)" class="text-lg" />
        </button>

        <!-- Hover flyout panel (children only, no parent label) -->
        <div
          v-if="item.children?.length && hoveredItem === item.id"
          class="absolute left-full top-0 ml-2 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50"
          @mouseenter="onPanelMouseEnter()"
          @mouseleave="onPanelMouseLeave()"
        >
          <NuxtLink
            v-for="child in item.children"
            :key="child.id"
            :to="child.to"
            class="flex items-center px-3 py-2 text-sm transition-colors duration-150"
            :class="isActive(child.to)
              ? 'sidebar-item-active font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'"
          >
            <span class="truncate">{{ child.label }}</span>
          </NuxtLink>
        </div>
      </div>
    </nav>
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
      <LayoutAppLogo />
    </template>

    <nav class="px-2 py-2">
      <ul class="flex flex-col gap-1">
        <li v-for="item in menuItems" :key="item.id">
          <!-- Parent with children (mobile) -->
          <template v-if="item.children?.length">
            <button
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              :class="isParentActive(item as MenuItem)
                ? 'sidebar-item-active shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'"
              @click="toggleMenu(item.id)"
            >
              <i :class="resolveMenuIcon(item.icon)" class="text-lg shrink-0 w-5 text-center" />
              <span class="truncate flex-1 text-left">{{ item.label }}</span>
              <i
                class="pi text-xs transition-transform duration-200"
                :class="isExpanded(item.id) ? 'pi-chevron-down' : 'pi-chevron-right'"
              />
            </button>

            <ul v-if="isExpanded(item.id)" class="mt-1 ml-5 pl-3 border-l border-gray-200 dark:border-gray-700 flex flex-col gap-1">
              <li v-for="child in item.children" :key="child.id">
                <NuxtLink
                  :to="child.to"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200"
                  :class="isActive(child.to)
                    ? 'sidebar-item-active shadow-sm font-medium'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'"
                  @click="layoutStore.closeMobileSidebar()"
                >
                  <span class="truncate">{{ child.label }}</span>
                </NuxtLink>
              </li>
            </ul>
          </template>

          <!-- Simple link (mobile) -->
          <NuxtLink
            v-else
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
    </nav>
  </PDrawer>
</template>
