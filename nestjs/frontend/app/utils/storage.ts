const PREFIX = 'app_'

export const storage = {
  get<T>(key: string): T | null {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw ? JSON.parse(raw) as T : null
    } catch {
      return null
    }
  },

  set<T>(key: string, value: T): void {
    if (!import.meta.client) return
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      // Storage full or unavailable — silently ignore
    }
  },

  remove(key: string): void {
    if (!import.meta.client) return
    localStorage.removeItem(PREFIX + key)
  },

  getString(key: string): string | null {
    if (!import.meta.client) return null
    return localStorage.getItem(PREFIX + key)
  },

  setString(key: string, value: string): void {
    if (!import.meta.client) return
    localStorage.setItem(PREFIX + key, value)
  }
}
