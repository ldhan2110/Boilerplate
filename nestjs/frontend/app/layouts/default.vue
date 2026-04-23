<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-950">
    <LayoutAppSidebar />

    <div class="flex-1 flex flex-col min-w-0">
      <LayoutAppHeader />

      <main class="flex-1 p-4 lg:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
