export default defineNuxtPlugin(() => {
  const userStore = useUserStore()
  const appConfig = useAppConfig()
  const colorMode = useColorMode()

  // Sync accent color to app config
  watch(
    () => userStore.preferences.accentColor,
    (color) => {
      appConfig.ui.colors.primary = color
    },
    { immediate: true }
  )

  // Sync dark mode to colorMode
  watch(
    () => userStore.preferences.darkMode,
    (mode) => {
      colorMode.preference = mode
    },
    { immediate: true }
  )
})
