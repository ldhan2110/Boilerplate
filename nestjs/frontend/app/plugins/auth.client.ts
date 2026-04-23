export default defineNuxtPlugin(async () => {
  const userStore = useUserStore()
  const restored = await userStore.restoreSession()

  if (!restored) {
    const { storage } = await import('~/utils')
    const cachedPrefs = storage.get<import('~/types').UserPreferences>('user_preferences')
    if (cachedPrefs) {
      userStore.preferences.locale = cachedPrefs.locale ?? 'en'
      userStore.preferences.darkMode = cachedPrefs.darkMode ?? 'light'
      userStore.preferences.accentColor = cachedPrefs.accentColor ?? 'green'
      userStore.preferences.dateFormat = cachedPrefs.dateFormat ?? 'DD/MM/YYYY HH:mm:ss'
    }
  }
})
