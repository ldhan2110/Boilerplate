import { defineStore } from 'pinia'

export const useLayoutStore = defineStore('layout', () => {
  const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')
  const sidebarMobileOpen = ref(false)

  // Persist to local Storage automatically
  watch(sidebarCollapsed, (val) => {
    localStorage.setItem('sidebarCollapsed', String(val))
  })

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleMobileSidebar() {
    sidebarMobileOpen.value = !sidebarMobileOpen.value
  }

  function closeMobileSidebar() {
    sidebarMobileOpen.value = false
  }

  return {
    sidebarCollapsed,
    sidebarMobileOpen,
    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar
  }
})
