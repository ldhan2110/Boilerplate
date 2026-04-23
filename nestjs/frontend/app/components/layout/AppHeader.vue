<script setup lang="ts">
const layoutStore = useLayoutStore()
</script>

<template>
  <header class="sticky top-0 z-30 flex items-center h-14 px-4 gap-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
    <!-- Left: toggle + breadcrumb -->
    <UButton
      :icon="layoutStore.sidebarCollapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
      color="neutral"
      variant="ghost"
      size="sm"
      class="hidden lg:flex"
      @click="layoutStore.toggleSidebar()"
    />
    <UButton
      icon="i-lucide-menu"
      color="neutral"
      variant="ghost"
      size="sm"
      class="lg:hidden"
      @click="layoutStore.toggleMobileSidebar()"
    />

    <LayoutAppBreadcrumb class="hidden md:flex" />

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Right: controls -->
    <div class="flex items-center gap-1">
      <HeaderLanguageSwitcher class="hidden md:flex" />
      <HeaderNotificationDropdown />
      <HeaderThemeToggle class="hidden md:flex" />
      <HeaderAccentColorPicker class="hidden md:flex" />

      <USeparator orientation="vertical" class="hidden md:flex h-6 mx-1" />

      <HeaderUserMenu />
    </div>
  </header>
</template>
