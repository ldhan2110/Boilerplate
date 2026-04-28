<script setup lang="ts">
const registered = useState<boolean>('page-ready-registered', () => false)
const isReady = useState<boolean>('page-ready', () => false)

const showSkeleton = computed(() => registered.value && !isReady.value)
</script>

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
          <Transition
            name="skeleton-fade"
            mode="out-in"
          >
            <CommonPageSkeleton
              v-if="showSkeleton"
              key="skeleton"
            />
            <slot
              v-else
              key="content"
            />
          </Transition>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.skeleton-fade-enter-active,
.skeleton-fade-leave-active {
  transition: opacity 0.2s ease;
}

.skeleton-fade-enter-from,
.skeleton-fade-leave-to {
  opacity: 0;
}
</style>
