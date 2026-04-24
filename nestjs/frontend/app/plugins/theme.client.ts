import { updatePreset } from '@primeuix/themes'

const ACCENT_PALETTE_MAP: Record<string, string> = {
  green: 'emerald',
  blue: 'blue',
  purple: 'purple',
  orange: 'orange'
}

function applyAccentColor(color: string) {
  const palette = ACCENT_PALETTE_MAP[color] || 'emerald'
  updatePreset({
    semantic: {
      primary: {
        50: `{${palette}.50}`,
        100: `{${palette}.100}`,
        200: `{${palette}.200}`,
        300: `{${palette}.300}`,
        400: `{${palette}.400}`,
        500: `{${palette}.500}`,
        600: `{${palette}.600}`,
        700: `{${palette}.700}`,
        800: `{${palette}.800}`,
        900: `{${palette}.900}`,
        950: `{${palette}.950}`
      }
    }
  })
}

export default defineNuxtPlugin((nuxtApp) => {
  const userStore = useUserStore()

  // Apply dark mode from stored preferences
  watch(
    () => userStore.preferences.darkMode,
    (mode) => {
      document.documentElement.classList.toggle('dark', mode === 'dark')
    },
    { immediate: true }
  )

  // Apply accent color from stored preferences
  watch(
    () => userStore.preferences.accentColor,
    (color) => {
      applyAccentColor(color)
    },
    { immediate: true }
  )

  // Restore locale from stored preferences
  const i18n = nuxtApp.$i18n as { setLocale: (locale: string) => Promise<void> }
  watch(
    () => userStore.preferences.locale,
    (locale) => {
      if (locale) {
        i18n.setLocale(locale)
      }
    },
    { immediate: true }
  )
})
