<template>
  <div class="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
    <LayoutAppHeader />

    <div class="flex flex-1 min-h-0 overflow-hidden">
      <LayoutAppSidebar />

      <main class="flex-1 min-w-0 overflow-y-auto">
        <div class="px-4 pt-3 lg:px-6 lg:pt-4">
          <LayoutAppBreadcrumb />
        </div>
        <div class="p-4 lg:p-6 pt-2 lg:pt-3">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
