export default defineNuxtPlugin(() => {
  const themeStore = useThemeStore()
  const appConfig = useAppConfig()

  themeStore.init()

  watch(
    () => themeStore.accentColor,
    (color) => {
      appConfig.ui.colors.primary = color
    },
    { immediate: true }
  )
})
