import { defineStore } from 'pinia'
import type {
  UserProfile,
  UserPreferences,
  UserMeResponse,
  LoginRequestDto
} from '~/types'
import {
  DEFAULT_PREFERENCES,
  COLOR_MAP,
  COLOR_TO_HEX
} from '~/types'
import { storage } from '~/utils'
import {
  loginApi,
  logoutApi,
  refreshTokenApi,
  fetchProfileApi,
  updatePreferencesApi
} from '~/services'

const STORAGE_KEYS = {
  refreshToken: 'refresh_token',
  profile: 'user_profile',
  preferences: 'user_preferences'
} as const

export const useUserStore = defineStore('user', () => {
  // --- State ---
  const accessToken = ref<string | null>(null)
  const accessExpireIn = ref<number | null>(null)
  const profile = ref<UserProfile | null>(null)
  const preferences = ref<UserPreferences>({ ...DEFAULT_PREFERENCES })

  let refreshTimer: ReturnType<typeof setTimeout> | null = null
  let syncTimer: ReturnType<typeof setTimeout> | null = null

  // --- Getters ---
  const isAuthenticated = computed(() => !!accessToken.value)
  const displayName = computed(() => profile.value?.usrNm ?? '')
  const userRole = computed(() => profile.value?.roleNm ?? '')

  // --- Helpers ---
  function mapBackendPreferences(me: UserMeResponse): UserPreferences {
    return {
      locale: me.langVal || DEFAULT_PREFERENCES.locale,
      darkMode: me.sysModVal || DEFAULT_PREFERENCES.darkMode,
      accentColor: COLOR_MAP[me.sysColrVal] || DEFAULT_PREFERENCES.accentColor,
      dateFormat: me.dtFmtVal || DEFAULT_PREFERENCES.dateFormat
    }
  }

  function mapProfileFromBackend(me: UserMeResponse): UserProfile {
    return {
      usrId: me.usrId,
      usrNm: me.usrNm,
      usrEml: me.usrEml,
      usrPhn: me.usrPhn,
      usrAddr: me.usrAddr,
      usrDesc: me.usrDesc,
      usrFileId: me.usrFileId,
      roleId: me.roleId,
      roleNm: me.roleNm
    }
  }

  function persistPreferences() {
    storage.set(STORAGE_KEYS.preferences, preferences.value)
  }

  function persistProfile() {
    storage.set(STORAGE_KEYS.profile, profile.value)
  }

  function scheduleRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer)
    if (!accessExpireIn.value) return
    const delay = Math.max(accessExpireIn.value - 30_000, 10_000)
    refreshTimer = setTimeout(() => {
      refreshTokens()
    }, delay)
  }

  function cancelRefresh() {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
  }

  // --- Actions ---
  async function login(request: LoginRequestDto): Promise<boolean> {
    try {
      const data = await loginApi(request)
      accessToken.value = data.accessToken
      accessExpireIn.value = data.accessExpireIn
      storage.setString(STORAGE_KEYS.refreshToken, data.refreshToken)
      scheduleRefresh()
      await fetchProfile()
      return true
    } catch {
      return false
    }
  }

  async function fetchProfile(): Promise<void> {
    try {
      const me = await fetchProfileApi()
      profile.value = mapProfileFromBackend(me)
      persistProfile()
      const backendPrefs = mapBackendPreferences(me)
      preferences.value = backendPrefs
      persistPreferences()
    } catch (error: any) {
      // Profile fetch failed — use cached data if available
      console.log('Failed to fetch profile, using cached data if available', error)
    }
  }

  async function refreshTokens(): Promise<boolean> {
    const storedRefresh = storage.getString(STORAGE_KEYS.refreshToken)
    if (!storedRefresh) return false

    try {
      const data = await refreshTokenApi(storedRefresh)
      accessToken.value = data.accessToken
      accessExpireIn.value = data.accessExpireIn
      storage.setString(STORAGE_KEYS.refreshToken, data.refreshToken)
      scheduleRefresh()
      return true
    } catch {
      clearState()
      return false
    }
  }

  async function logout(): Promise<void> {
    try {
      await logoutApi()
      clearState()
      navigateTo('/login')
    } catch {
      // Best effort — clear state regardless
    }
    clearState()
  }

  function clearState() {
    cancelRefresh()
    if (syncTimer) {
      clearTimeout(syncTimer)
      syncTimer = null
    }
    accessToken.value = null
    accessExpireIn.value = null
    profile.value = null
    preferences.value = { ...DEFAULT_PREFERENCES }
    storage.remove(STORAGE_KEYS.refreshToken)
    storage.remove(STORAGE_KEYS.profile)
    storage.remove(STORAGE_KEYS.preferences)
  }

  function updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): void {
    preferences.value[key] = value
    persistPreferences()
    debouncedSyncToBackend()
  }

  function debouncedSyncToBackend() {
    if (syncTimer) clearTimeout(syncTimer)
    if (!isAuthenticated.value) return
    syncTimer = setTimeout(async () => {
      try {
        await updatePreferencesApi({
          langVal: preferences.value.locale,
          sysModVal: preferences.value.darkMode,
          sysColrVal: COLOR_TO_HEX[preferences.value.accentColor] || preferences.value.accentColor,
          dtFmtVal: preferences.value.dateFormat
        })
      } catch {
        // Sync failed — preferences are still saved locally
      }
    }, 500)
  }

  async function restoreSession(): Promise<boolean> {
    // Load cached data for instant UI
    const cachedProfile = storage.get<UserProfile>(STORAGE_KEYS.profile)
    const cachedPrefs = storage.get<UserPreferences>(STORAGE_KEYS.preferences)
    if (cachedProfile) profile.value = cachedProfile
    if (cachedPrefs) preferences.value = { ...DEFAULT_PREFERENCES, ...cachedPrefs }

    // Attempt token refresh
    const refreshed = await refreshTokens()
    if (refreshed) {
      await fetchProfile()
      return true
    }
    return false
  }

  return {
    // State
    accessToken,
    accessExpireIn,
    profile,
    preferences,
    // Getters
    isAuthenticated,
    displayName,
    userRole,
    // Actions
    login,
    fetchProfile,
    refreshTokens,
    logout,
    updatePreference,
    restoreSession
  }
})
