export type AccentColor = 'green' | 'blue' | 'purple' | 'orange'

export const useThemeStore = defineStore('theme', () => {
  const accentColor = ref<AccentColor>('green')

  function setAccentColor(color: AccentColor) {
    accentColor.value = color
    if (import.meta.client) {
      localStorage.setItem('accent-color', color)
    }
  }

  function init() {
    if (import.meta.client) {
      const saved = localStorage.getItem('accent-color') as AccentColor | null
      if (saved && ['green', 'blue', 'purple', 'orange'].includes(saved)) {
        accentColor.value = saved
      }
    }
  }

  return { accentColor, setAccentColor, init }
})
