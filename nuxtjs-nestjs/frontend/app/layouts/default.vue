<template>
  <div class="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
    <LayoutAppHeader />

    <div class="flex flex-1 min-h-0 overflow-hidden">
      <LayoutAppSidebar />

      <main class="flex-1 min-w-0 overflow-y-auto">
        <div class="px-3 pt-2 lg:px-4 lg:pt-3">
          <LayoutAppBreadcrumb />
        </div>
        <div class="p-3 lg:p-4 pt-1.5 lg:pt-2">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
