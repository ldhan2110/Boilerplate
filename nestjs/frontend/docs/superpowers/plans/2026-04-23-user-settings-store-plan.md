# User Settings Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified Pinia store that manages auth tokens (access in memory, refresh in localStorage), user profile, and UI preferences with two-way backend sync, replacing the existing theme store.

**Architecture:** Single `useUserStore` with typed localStorage helpers, a `$fetch` wrapper composable for auth header injection + 401 retry, a client plugin for session restore, and a global route guard. Existing theme/language components are rewired to use the new store.

**Tech Stack:** Nuxt 4, Pinia 3, TypeScript, `$fetch`, `useColorMode()` from @nuxt/ui, `@nuxtjs/i18n`

---

### Task 1: Types — `app/types/user.ts` + barrel export

**Files:**
- Create: `app/types/user.ts`
- Create: `app/types/index.ts`

- [ ] **Step 1: Create type definitions**

Create `app/types/user.ts`:

```typescript
export interface UserProfile {
  usrId: string
  usrNm: string
  usrEml: string
  usrPhn: string
  usrAddr: string
  usrDesc: string
  usrFileId: string
  roleId: string
  roleNm: string
}

export interface UserPreferences {
  locale: string
  darkMode: string
  accentColor: string
  dateFormat: string
}

export interface LoginResponse {
  accessToken: string
  accessExpireIn: number
  refreshToken: string
  refreshExpireIn: number
}

export interface RefreshTokenResponse {
  accessToken: string
  accessExpireIn: number
  refreshToken: string
  refreshExpireIn: number
}

export interface UserMeResponse extends UserProfile {
  langVal: string
  sysModVal: string
  sysColrVal: string
  dtFmtVal: string
  createdAt: string
  updatedAt: string
  useFlg: boolean
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  locale: 'en',
  darkMode: 'light',
  accentColor: 'green',
  dateFormat: 'DD/MM/YYYY HH:mm:ss'
}

export const COLOR_MAP: Record<string, string> = {
  '#52c41a': 'green',
  '#1890ff': 'blue',
  '#722ed1': 'purple',
  '#fa8c16': 'orange'
}

export const COLOR_TO_HEX: Record<string, string> = {
  green: '#52c41a',
  blue: '#1890ff',
  purple: '#722ed1',
  orange: '#fa8c16'
}
```

- [ ] **Step 2: Create barrel export**

Create `app/types/index.ts`:

```typescript
export type {
  UserProfile,
  UserPreferences,
  LoginResponse,
  RefreshTokenResponse,
  UserMeResponse
} from './user'

export {
  DEFAULT_PREFERENCES,
  COLOR_MAP,
  COLOR_TO_HEX
} from './user'
```

- [ ] **Step 3: Commit**

```bash
git add app/types/user.ts app/types/index.ts
git commit -m "feat: add user types and constants for settings store"
```

---

### Task 2: Storage utility — `app/utils/storage.ts` + barrel export

**Files:**
- Create: `app/utils/storage.ts`
- Create: `app/utils/index.ts`

- [ ] **Step 1: Create typed localStorage helpers**

Create `app/utils/storage.ts`:

```typescript
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
```

- [ ] **Step 2: Create barrel export**

Create `app/utils/index.ts`:

```typescript
export { storage } from './storage'
```

- [ ] **Step 3: Commit**

```bash
git add app/utils/storage.ts app/utils/index.ts
git commit -m "feat: add typed localStorage helpers with app_ prefix"
```

---

### Task 3: useApi composable — `app/composables/useApi.ts` + barrel export

**Files:**
- Create: `app/composables/useApi.ts`
- Create: `app/composables/index.ts`
- Modify: `nuxt.config.ts` (add runtimeConfig for API base URL)

- [ ] **Step 1: Add API base URL to nuxt.config.ts**

In `nuxt.config.ts`, add `runtimeConfig` after the `compatibilityDate` line:

```typescript
runtimeConfig: {
  public: {
    apiBase: 'http://localhost:3000'
  }
},
```

- [ ] **Step 2: Create useApi composable**

Create `app/composables/useApi.ts`:

```typescript
import type { LoginResponse, RefreshTokenResponse, UserMeResponse } from '~/types'

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string

  function getAccessToken(): string | null {
    const userStore = useUserStore()
    return userStore.accessToken
  }

  async function request<T>(url: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    const token = getAccessToken()
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {})
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    try {
      return await $fetch<T>(url, {
        baseURL,
        ...options,
        headers
      })
    } catch (error: any) {
      if (error?.statusCode === 401 && token) {
        const userStore = useUserStore()
        const refreshed = await userStore.refreshTokens()
        if (refreshed) {
          headers.Authorization = `Bearer ${userStore.accessToken}`
          return await $fetch<T>(url, {
            baseURL,
            ...options,
            headers
          })
        }
        await userStore.logout()
        navigateTo('/login')
      }
      throw error
    }
  }

  return {
    get: <T>(url: string, options?: Parameters<typeof $fetch>[1]) =>
      request<T>(url, { ...options, method: 'GET' }),

    post: <T>(url: string, body?: unknown, options?: Parameters<typeof $fetch>[1]) =>
      request<T>(url, { ...options, method: 'POST', body }),

    patch: <T>(url: string, body?: unknown, options?: Parameters<typeof $fetch>[1]) =>
      request<T>(url, { ...options, method: 'PATCH', body })
  }
}
```

- [ ] **Step 3: Create barrel export**

Create `app/composables/index.ts`:

```typescript
export { useApi } from './useApi'
```

- [ ] **Step 4: Commit**

```bash
git add app/composables/useApi.ts app/composables/index.ts nuxt.config.ts
git commit -m "feat: add useApi composable with auth header injection and 401 retry"
```

---

### Task 4: User store — `app/stores/user.ts` + barrel export

**Files:**
- Create: `app/stores/user.ts`
- Create: `app/stores/index.ts`

- [ ] **Step 1: Create the unified user store**

Create `app/stores/user.ts`:

```typescript
import { defineStore } from 'pinia'
import type {
  UserProfile,
  UserPreferences,
  LoginResponse,
  UserMeResponse
} from '~/types'
import {
  DEFAULT_PREFERENCES,
  COLOR_MAP,
  COLOR_TO_HEX
} from '~/types'
import { storage } from '~/utils'

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
  async function login(username: string, password: string): Promise<boolean> {
    const config = useRuntimeConfig()
    try {
      const data = await $fetch<LoginResponse>('/api/auth/login', {
        baseURL: config.public.apiBase as string,
        method: 'POST',
        body: { username, password }
      })

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
    const api = useApi()
    try {
      const me = await api.get<UserMeResponse>('/api/auth/me')
      profile.value = mapProfileFromBackend(me)
      persistProfile()

      const backendPrefs = mapBackendPreferences(me)
      preferences.value = backendPrefs
      persistPreferences()
    } catch {
      // Profile fetch failed — use cached data if available
    }
  }

  async function refreshTokens(): Promise<boolean> {
    const config = useRuntimeConfig()
    const storedRefresh = storage.getString(STORAGE_KEYS.refreshToken)
    if (!storedRefresh) return false

    try {
      const data = await $fetch<LoginResponse>('/api/auth/refresh-token', {
        baseURL: config.public.apiBase as string,
        method: 'POST',
        body: { refreshToken: storedRefresh }
      })

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
      const api = useApi()
      await api.post('/api/auth/logout')
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
        const api = useApi()
        await api.patch('/api/auth/preferences', {
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
```

- [ ] **Step 2: Create barrel export**

Create `app/stores/index.ts`:

```typescript
export { useUserStore } from './user'
export { useNotificationStore } from './notification'
export { useLayoutStore } from './layout'
```

- [ ] **Step 3: Commit**

```bash
git add app/stores/user.ts app/stores/index.ts
git commit -m "feat: add unified user store with auth, profile, and preferences"
```

---

### Task 5: Auth plugin — `app/plugins/auth.client.ts`

**Files:**
- Create: `app/plugins/auth.client.ts`

- [ ] **Step 1: Create the auth client plugin**

Create `app/plugins/auth.client.ts`:

```typescript
export default defineNuxtPlugin(async () => {
  const userStore = useUserStore()
  const restored = await userStore.restoreSession()

  if (!restored) {
    // Load guest preferences from localStorage for theme/locale
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
```

- [ ] **Step 2: Commit**

```bash
git add app/plugins/auth.client.ts
git commit -m "feat: add auth client plugin for session restore on app init"
```

---

### Task 6: Route guard — `app/middleware/auth.global.ts`

**Files:**
- Create: `app/middleware/auth.global.ts`

- [ ] **Step 1: Create global auth middleware**

Create `app/middleware/auth.global.ts`:

```typescript
export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()
  const publicRoutes = ['/login']

  if (!userStore.isAuthenticated && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }

  if (userStore.isAuthenticated && to.path === '/login') {
    return navigateTo('/')
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add app/middleware/auth.global.ts
git commit -m "feat: add global auth route guard"
```

---

### Task 7: Rewire theme plugin — `app/plugins/theme.client.ts`

**Files:**
- Modify: `app/plugins/theme.client.ts`
- Delete: `app/stores/theme.ts`

- [ ] **Step 1: Rewrite theme plugin to use user store**

Replace entire contents of `app/plugins/theme.client.ts`:

```typescript
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
```

- [ ] **Step 2: Delete the old theme store**

```bash
rm app/stores/theme.ts
```

- [ ] **Step 3: Commit**

```bash
git add app/plugins/theme.client.ts app/stores/index.ts
git rm app/stores/theme.ts
git commit -m "refactor: rewire theme plugin to use user store, remove theme store"
```

---

### Task 8: Rewire ThemeToggle component

**Files:**
- Modify: `app/components/header/ThemeToggle.vue`

- [ ] **Step 1: Update ThemeToggle to use user store**

Replace entire contents of `app/components/header/ThemeToggle.vue`:

```vue
<script setup lang="ts">
const { t } = useI18n()
const colorMode = useColorMode()
const userStore = useUserStore()

function toggle() {
  const newMode = colorMode.value === 'dark' ? 'light' : 'dark'
  userStore.updatePreference('darkMode', newMode)
}
</script>

<template>
  <UButton
    color="neutral"
    variant="ghost"
    size="sm"
    :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
    :title="colorMode.value === 'dark' ? t('header.lightMode') : t('header.darkMode')"
    @click="toggle"
  />
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/header/ThemeToggle.vue
git commit -m "refactor: ThemeToggle uses user store for preference persistence"
```

---

### Task 9: Rewire LanguageSwitcher component

**Files:**
- Modify: `app/components/header/LanguageSwitcher.vue`

- [ ] **Step 1: Update LanguageSwitcher to use user store**

Replace entire contents of `app/components/header/LanguageSwitcher.vue`:

```vue
<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
const userStore = useUserStore()

const currentLocale = computed(() =>
  (locales.value as any[]).find((l: any) => l.code === locale.value)
)

const localeItems = computed(() =>
  (locales.value as any[]).map(l => ({
    label: l.name,
    onSelect: () => {
      setLocale(l.code)
      userStore.updatePreference('locale', l.code)
    }
  }))
)
</script>

<template>
  <UDropdownMenu :items="localeItems">
    <UButton
      color="neutral"
      variant="ghost"
      size="sm"
      :label="currentLocale?.code?.toUpperCase()"
      icon="i-lucide-globe"
      trailing-icon="i-lucide-chevron-down"
    />
  </UDropdownMenu>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/header/LanguageSwitcher.vue
git commit -m "refactor: LanguageSwitcher uses user store for preference persistence"
```

---

### Task 10: Wire login page

**Files:**
- Modify: `app/pages/login.vue`

- [ ] **Step 1: Add login form logic**

Replace entire contents of `app/pages/login.vue`:

```vue
<script setup lang="ts">
definePageMeta({
  layout: false
})

const { t } = useI18n()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: ''
})
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const success = await userStore.login(form.username, form.password)
    if (success) {
      await navigateTo('/')
    } else {
      error.value = t('login.invalidCredentials')
    }
  } catch {
    error.value = t('login.loginError')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
    <div class="w-full max-w-sm">
      <UCard class="shadow-lg">
        <!-- Logo + heading -->
        <div class="text-center mb-6">
          <div class="flex justify-center mb-4">
            <AppLogo />
          </div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ t('login.welcome') }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ t('login.subtitle') }}
          </p>
        </div>

        <!-- Error message -->
        <div v-if="error" class="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {{ error }}
        </div>

        <!-- Form -->
        <form class="space-y-4" @submit.prevent="handleLogin">
          <UFormField :label="t('login.email')">
            <UInput
              v-model="form.username"
              type="text"
              :placeholder="t('login.emailPlaceholder')"
              icon="i-lucide-mail"
              size="lg"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField>
            <template #label>
              <div class="flex items-center justify-between w-full">
                <span>{{ t('login.password') }}</span>
                <UButton
                  :label="t('login.forgotPassword')"
                  variant="link"
                  size="xs"
                  :padded="false"
                />
              </div>
            </template>
            <UInput
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              size="lg"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <div class="flex items-center gap-2">
            <UCheckbox :label="t('login.rememberMe')" />
          </div>

          <UButton
            :label="loading ? t('login.signingIn') : t('login.signIn')"
            type="submit"
            block
            size="lg"
            :loading="loading"
            :disabled="loading || !form.username || !form.password"
          />
        </form>

        <!-- Language switcher -->
        <div class="mt-6 flex justify-center">
          <HeaderLanguageSwitcher />
        </div>
      </UCard>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Add missing i18n keys to en.json**

Add these keys to the `login` section of `app/locales/en.json` (or `i18n/locales/en.json`, whichever is active):

```json
"invalidCredentials": "Invalid username or password",
"loginError": "An error occurred. Please try again.",
"signingIn": "Signing in..."
```

- [ ] **Step 3: Add missing i18n keys to vi.json**

Add these keys to the `login` section of `app/locales/vi.json` (or `i18n/locales/vi.json`, whichever is active):

```json
"invalidCredentials": "Tên đăng nhập hoặc mật khẩu không đúng",
"loginError": "Đã xảy ra lỗi. Vui lòng thử lại.",
"signingIn": "Đang đăng nhập..."
```

- [ ] **Step 4: Commit**

```bash
git add app/pages/login.vue i18n/locales/en.json i18n/locales/vi.json
git commit -m "feat: wire login page to user store with form handling and error display"
```

---

### Task 11: Add .env.example and nuxt.config aliases

**Files:**
- Create or Modify: `frontend/.env.example`
- Modify: `nuxt.config.ts`

- [ ] **Step 1: Create .env.example**

Create `frontend/.env.example` (or append if it exists):

```
# API
NUXT_PUBLIC_API_BASE=http://localhost:3000
```

- [ ] **Step 2: Add path aliases to nuxt.config.ts**

Add `alias` config to `nuxt.config.ts` after `runtimeConfig`:

```typescript
import { resolve } from 'node:path'

// Inside defineNuxtConfig, after runtimeConfig:
alias: {
  '@stores': resolve(__dirname, 'app/stores'),
  '@composables': resolve(__dirname, 'app/composables'),
  '@types': resolve(__dirname, 'app/types'),
  '@utils': resolve(__dirname, 'app/utils')
},
```

- [ ] **Step 3: Commit**

```bash
git add .env.example nuxt.config.ts
git commit -m "feat: add env example and path aliases for stores, composables, types, utils"
```

---

### Task 12: Build verification

- [ ] **Step 1: Run type check**

```bash
cd frontend && npx nuxi typecheck
```

Expected: No errors. If there are type errors, fix them before proceeding.

- [ ] **Step 2: Run dev server**

```bash
cd frontend && npx nuxi dev
```

Expected: Dev server starts without errors. Visit `http://localhost:3000` — should redirect to `/login`. Verify:
- Login page renders
- Language switcher works
- Theme toggle works
- No console errors

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve build issues from user settings store integration"
```
