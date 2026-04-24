<script setup lang="ts">
const layoutStore = useLayoutStore()

function onBurgerClick() {
  if (window.matchMedia('(min-width: 1024px)').matches) {
    layoutStore.toggleSidebar()
  }
  else {
    layoutStore.toggleMobileSidebar()
  }
}
</script>

<template>
  <header class="sticky top-0 z-30 flex items-center h-14 px-4 gap-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
    <!-- Burger — collapse sidebar on desktop, open drawer on mobile -->
    <PButton
      icon="pi pi-bars"
      severity="secondary"
      text
      rounded
      size="small"
      @click="onBurgerClick"
    />

    <!-- Logo -->
    <NuxtLink to="/" class="flex items-center">
      <LayoutAppLogo />
    </NuxtLink>

    <LayoutAppBreadcrumb class="hidden md:flex" />

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Right: controls -->
    <div class="flex items-center gap-0.5">
      <HeaderLanguageSwitcher class="hidden md:flex" />
      <HeaderNotificationDropdown />
      <HeaderThemeToggle class="hidden md:flex" />
      <HeaderAccentColorPicker class="hidden md:flex" />

      <PDivider layout="vertical" class="hidden md:flex h-6 mx-1" />

      <HeaderUserMenu />
    </div>
  </header>
</template>
