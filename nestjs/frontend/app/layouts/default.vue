<template>
  <div class="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
    <LayoutAppHeader />

    <div class="flex flex-1 min-h-0">
      <LayoutAppSidebar />

      <main class="flex-1 p-4 lg:p-6 min-w-0 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
