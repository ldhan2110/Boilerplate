# PrimeVue Migration, API Refactor & Layout Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all components from Nuxt UI to PrimeVue, extract apiClient service layer from useApi composable, and fix responsive layout bugs (sidebar overlap, notification bubble misplacement).

**Architecture:** Classic service/composable split — `apiClient.ts` handles raw HTTP with token injection, `useApi.ts` wraps it with Vue reactivity. All 13 Vue components swap Nuxt UI primitives for PrimeVue equivalents. Sidebar menu becomes dynamic (backend-driven) using PPanelMenu. Layout gets `flex-shrink-0` fix and PrimeVue's POverlayBadge replaces broken absolute-positioned notification badge.

**Tech Stack:** Nuxt 4, Vue 3 (Composition API), PrimeVue 4.5 (Aura theme), Pinia 3, Tailwind CSS 4, TypeScript 6, ofetch

**Spec:** `docs/superpowers/specs/2026-04-24-primevue-migration-api-refactor-design.md`

---

## File Map

### New Files
- `app/services/apiClient.ts` — Non-composable HTTP client with token injection + 401 interceptor
- `app/utils/constants/menuIcons.ts` — Icon key → PrimeIcon class mapping
- `app/types/menu.ts` — MenuItem interface for dynamic sidebar

### Modified Files
- `app/composables/useApi.ts` — Rewrite to wrap apiClient with reactive refs
- `app/stores/common/user.ts` — Replace `useApi()` calls with `apiClient` imports
- `app/stores/common/notification.ts` — Update icon names from Lucide to PrimeIcons
- `nuxt.config.ts` — Remove `@nuxt/ui` module
- `app/app.vue` — Remove `UApp`, add `PToast`
- `app/app.config.ts` — Delete (Nuxt UI specific)
- `app/layouts/default.vue` — No Nuxt UI usage, but add `shrink-0` to sidebar slot
- `app/components/layout/AppSidebar.vue` — Full rewrite: PPanelMenu, PDrawer, PAvatar, dynamic menu
- `app/components/layout/AppHeader.vue` — PButton, PDivider
- `app/components/layout/AppBreadcrumb.vue` — PBreadcrumb
- `app/components/header/NotificationDropdown.vue` — POverlayBadge, PPopover, PButton
- `app/components/header/UserMenu.vue` — PMenu (popup), PButton, PAvatar
- `app/components/header/ThemeToggle.vue` — PButton
- `app/components/header/LanguageSwitcher.vue` — PMenu (popup), PButton
- `app/components/header/AccentColorPicker.vue` — PPopover, PButton
- `app/components/AppLogo.vue` — No changes needed (pure Tailwind)
- `app/pages/login.vue` — PCard, PInputText, PPassword, PFloatLabel, PCheckbox, PButton
- `app/pages/index.vue` — PCard
- `app/plugins/theme.client.ts` — Remove `appConfig.ui.colors` watch (Nuxt UI specific)
- `package.json` — Remove `@nuxt/ui` dependency

---

## Task 1: Create apiClient Service

**Files:**
- Create: `app/services/apiClient.ts`

- [ ] **Step 1: Create the apiClient service**

```ts
// app/services/apiClient.ts
import type { LoginResponse } from '~/types'

let _baseURL: string | null = null

function getBaseURL(): string {
  if (!_baseURL) {
    const config = useRuntimeConfig()
    _baseURL = config.public.apiBase as string
  }
  return _baseURL
}

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
      baseURL: getBaseURL(),
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
          baseURL: getBaseURL(),
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

export const apiClient = {
  get: <T>(url: string, options?: Parameters<typeof $fetch>[1]) =>
    request<T>(url, { ...options, method: 'GET' }),

  post: <T>(url: string, body?: Record<string, any> | null, options?: Parameters<typeof $fetch>[1]) =>
    request<T>(url, { ...options, method: 'POST', body }),

  put: <T>(url: string, body?: Record<string, any> | null, options?: Parameters<typeof $fetch>[1]) =>
    request<T>(url, { ...options, method: 'PUT', body }),

  patch: <T>(url: string, body?: Record<string, any> | null, options?: Parameters<typeof $fetch>[1]) =>
    request<T>(url, { ...options, method: 'PATCH', body }),

  delete: <T>(url: string, options?: Parameters<typeof $fetch>[1]) =>
    request<T>(url, { ...options, method: 'DELETE' })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/services/apiClient.ts
git commit -m "feat: add apiClient service with token injection and 401 interceptor"
```

---

## Task 2: Refactor useApi Composable

**Files:**
- Modify: `app/composables/useApi.ts`

- [ ] **Step 1: Rewrite useApi to wrap apiClient with reactive refs**

Replace the entire file with:

```ts
// app/composables/useApi.ts
import { apiClient } from '~/services/apiClient'

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: Record<string, any> | null
  headers?: Record<string, string>
  immediate?: boolean
}

export function useApi<T>(url: string, options: UseApiOptions = {}) {
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<Error | null>(null)
  const loading = ref(false)

  async function execute(overrideBody?: Record<string, any> | null): Promise<T | null> {
    loading.value = true
    error.value = null
    try {
      const method = options.method || 'GET'
      const fetchOptions: Parameters<typeof $fetch>[1] = {
        headers: options.headers
      }
      const body = overrideBody !== undefined ? overrideBody : options.body

      let result: T
      switch (method) {
        case 'POST':
          result = await apiClient.post<T>(url, body, fetchOptions)
          break
        case 'PUT':
          result = await apiClient.put<T>(url, body, fetchOptions)
          break
        case 'PATCH':
          result = await apiClient.patch<T>(url, body, fetchOptions)
          break
        case 'DELETE':
          result = await apiClient.delete<T>(url, fetchOptions)
          break
        default:
          result = await apiClient.get<T>(url, fetchOptions)
      }

      data.value = result
      return result
    } catch (e: any) {
      error.value = e
      return null
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, execute }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/composables/useApi.ts
git commit -m "refactor: useApi now wraps apiClient with reactive refs"
```

---

## Task 3: Update User Store to Use apiClient

**Files:**
- Modify: `app/stores/common/user.ts`

- [ ] **Step 1: Replace useApi() calls with apiClient imports**

At the top of the file, replace the import line and add apiClient:

```ts
// app/stores/common/user.ts
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
import { storage } from '~/utils/storage'
import { apiClient } from '~/services/apiClient'
```

Replace the `login` function (use `apiClient.post` instead of raw `$fetch`):

```ts
  async function login(username: string, password: string): Promise<boolean> {
    try {
      const data = await apiClient.post<LoginResponse>('/api/auth/login', { username, password })

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
```

Replace the `fetchProfile` function:

```ts
  async function fetchProfile(): Promise<void> {
    try {
      const me = await apiClient.get<UserMeResponse>('/api/auth/me')
      profile.value = mapProfileFromBackend(me)
      persistProfile()

      const backendPrefs = mapBackendPreferences(me)
      preferences.value = backendPrefs
      persistPreferences()
    } catch {
      // Profile fetch failed — use cached data if available
    }
  }
```

Replace the `refreshTokens` function (this one must still use raw `$fetch` to avoid circular dependency — apiClient calls refreshTokens on 401):

```ts
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
```

Replace the `logout` function:

```ts
  async function logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout')
    } catch {
      // Best effort — clear state regardless
    }
    clearState()
  }
```

Replace the `debouncedSyncToBackend` function:

```ts
  function debouncedSyncToBackend() {
    if (syncTimer) clearTimeout(syncTimer)
    if (!isAuthenticated.value) return
    syncTimer = setTimeout(async () => {
      try {
        await apiClient.patch('/api/auth/preferences', {
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
```

- [ ] **Step 2: Commit**

```bash
git add app/stores/common/user.ts
git commit -m "refactor: user store uses apiClient instead of useApi composable"
```

---

## Task 4: Create Menu Types and Icon Constants

**Files:**
- Create: `app/types/menu.ts`
- Modify: `app/types/index.ts`
- Create: `app/utils/constants/menuIcons.ts`
- Modify: `app/utils/index.ts`

- [ ] **Step 1: Create MenuItem interface**

```ts
// app/types/menu.ts
export interface AppMenuItem {
  id: string
  label: string
  icon?: string
  to?: string
  children?: AppMenuItem[]
}
```

- [ ] **Step 2: Export from types/index.ts**

Add to the existing exports in `app/types/index.ts`:

```ts
export type { AppMenuItem } from './menu'
```

- [ ] **Step 3: Create menu icon constants**

```bash
mkdir -p app/utils/constants
```

```ts
// app/utils/constants/menuIcons.ts
export const MENU_ICONS: Record<string, string> = {
  dashboard: 'pi pi-objects-column',
  users: 'pi pi-users',
  settings: 'pi pi-cog',
  shield: 'pi pi-shield',
  clipboard: 'pi pi-clipboard',
  home: 'pi pi-home',
  chart: 'pi pi-chart-bar',
  file: 'pi pi-file',
  folder: 'pi pi-folder',
  bell: 'pi pi-bell',
  mail: 'pi pi-envelope',
  calendar: 'pi pi-calendar',
  search: 'pi pi-search',
  star: 'pi pi-star',
  heart: 'pi pi-heart',
  check: 'pi pi-check',
  times: 'pi pi-times',
  plus: 'pi pi-plus',
  minus: 'pi pi-minus',
  pencil: 'pi pi-pencil',
  trash: 'pi pi-trash',
  download: 'pi pi-download',
  upload: 'pi pi-upload',
  refresh: 'pi pi-refresh',
  lock: 'pi pi-lock',
  unlock: 'pi pi-unlock',
  eye: 'pi pi-eye',
  link: 'pi pi-link',
  tag: 'pi pi-tag',
  bookmark: 'pi pi-bookmark',
  database: 'pi pi-database',
  server: 'pi pi-server',
  code: 'pi pi-code',
  globe: 'pi pi-globe',
  map: 'pi pi-map',
  image: 'pi pi-image',
  video: 'pi pi-video'
}

export function resolveMenuIcon(iconKey?: string): string | undefined {
  if (!iconKey) return undefined
  return MENU_ICONS[iconKey] || iconKey
}
```

- [ ] **Step 4: Export from utils/index.ts**

Add to `app/utils/index.ts`:

```ts
export * from './constants/menuIcons'
```

- [ ] **Step 5: Commit**

```bash
git add app/types/menu.ts app/types/index.ts app/utils/constants/menuIcons.ts app/utils/index.ts
git commit -m "feat: add MenuItem type and menu icon constants for dynamic sidebar"
```

---

## Task 5: Update Notification Store Icons

**Files:**
- Modify: `app/stores/common/notification.ts`

- [ ] **Step 1: Replace Lucide icons with PrimeIcons**

Replace the mock data icons:

```ts
  const notifications = ref<AppNotification[]>([
    {
      id: '1',
      icon: 'pi pi-user-plus',
      message: 'New user registered: John Doe',
      time: '5 min ago',
      read: false
    },
    {
      id: '2',
      icon: 'pi pi-shield',
      message: 'Role "Editor" was updated',
      time: '1 hour ago',
      read: false
    },
    {
      id: '3',
      icon: 'pi pi-cog',
      message: 'System settings changed',
      time: '3 hours ago',
      read: true
    }
  ])
```

- [ ] **Step 2: Commit**

```bash
git add app/stores/common/notification.ts
git commit -m "refactor: update notification icons from Lucide to PrimeIcons"
```

---

## Task 6: Migrate app.vue and Nuxt Config

**Files:**
- Modify: `app/app.vue`
- Modify: `nuxt.config.ts`
- Delete: `app/app.config.ts`
- Modify: `app/plugins/theme.client.ts`

- [ ] **Step 1: Update app.vue — remove UApp, add PToast**

Replace the entire template and script:

```vue
<script setup lang="ts">
const { t } = useI18n()

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ]
})

useSeoMeta({
  title: t('app.name'),
  description: 'A production-ready NuxtJS boilerplate'
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <PToast />
</template>
```

- [ ] **Step 2: Remove @nuxt/ui from nuxt.config.ts**

Remove `'@nuxt/ui'` from the modules array. The result should be:

```ts
  modules: [
    '@nuxt/eslint',
    '@primevue/nuxt-module',
    '@pinia/nuxt',
    '@nuxtjs/i18n'
  ],
```

- [ ] **Step 3: Delete app.config.ts**

```bash
rm app/app.config.ts
```

- [ ] **Step 4: Update theme.client.ts — remove Nuxt UI color sync**

Replace the entire file. Remove the `appConfig.ui.colors` watcher since that was Nuxt UI specific. Keep only the dark mode sync:

```ts
// app/plugins/theme.client.ts
export default defineNuxtPlugin(() => {
  const userStore = useUserStore()
  const colorMode = useColorMode()

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

- [ ] **Step 5: Commit**

```bash
git add app/app.vue nuxt.config.ts app/plugins/theme.client.ts
git rm app/app.config.ts
git commit -m "refactor: remove Nuxt UI from app shell and config"
```

---

## Task 7: Migrate AppSidebar to PrimeVue with Dynamic Menu

**Files:**
- Modify: `app/components/layout/AppSidebar.vue`
- Modify: `app/layouts/default.vue`

- [ ] **Step 1: Add shrink-0 to sidebar in default.vue**

The layout stays mostly the same. Only the sidebar wrapper needs `shrink-0`:

```vue
<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-950">
    <LayoutAppSidebar />

    <div class="flex-1 flex flex-col min-w-0">
      <LayoutAppHeader />

      <main class="flex-1 p-4 lg:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
```

Note: The `shrink-0` class will be on the `<aside>` element inside AppSidebar itself (see next step).

- [ ] **Step 2: Rewrite AppSidebar with PrimeVue components and dynamic menu**

Replace the entire file:

```vue
<script setup lang="ts">
import type { AppMenuItem } from '~/types'
import { resolveMenuIcon } from '~/utils/constants/menuIcons'

const { t } = useI18n()
const layoutStore = useLayoutStore()
const route = useRoute()
const userStore = useUserStore()

// TODO: Replace with apiClient.get<AppMenuItem[]>('/api/menu') when backend is ready
const menuSections = computed(() => [
  {
    title: t('sidebar.main'),
    items: [
      { id: 'dashboard', label: t('sidebar.dashboard'), icon: 'dashboard', to: '/' },
      { id: 'users', label: t('sidebar.users'), icon: 'users', to: '/users' },
      { id: 'settings', label: t('sidebar.settings'), icon: 'settings', to: '/settings' }
    ] as AppMenuItem[]
  },
  {
    title: t('sidebar.admin'),
    items: [
      { id: 'roles', label: t('sidebar.roles'), icon: 'shield', to: '/roles' },
      { id: 'programs', label: t('sidebar.programs'), icon: 'clipboard', to: '/programs' }
    ] as AppMenuItem[]
  }
])

function buildPanelMenuItems(items: AppMenuItem[]) {
  return items.map(item => ({
    label: item.label,
    icon: resolveMenuIcon(item.icon),
    to: item.to,
    command: () => {
      if (item.to) navigateTo(item.to)
    },
    items: item.children ? buildPanelMenuItems(item.children) : undefined,
    class: item.to && route.path === item.to ? 'active-menu-item' : ''
  }))
}

function isActive(to: string) {
  return route.path === to
}
</script>

<template>
  <!-- Desktop sidebar -->
  <aside
    class="hidden lg:flex flex-col shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 h-screen sticky top-0"
    :class="layoutStore.sidebarCollapsed ? 'w-16' : 'w-60'"
  >
    <!-- Logo -->
    <div class="flex items-center h-14 px-3 border-b border-gray-200 dark:border-gray-800">
      <NuxtLink to="/" class="flex items-center">
        <AppLogo :collapsed="layoutStore.sidebarCollapsed" />
      </NuxtLink>
    </div>

    <!-- Menu -->
    <nav class="flex-1 overflow-y-auto p-2 space-y-4">
      <div v-for="section in menuSections" :key="section.title">
        <p
          v-if="!layoutStore.sidebarCollapsed"
          class="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
        >
          {{ section.title }}
        </p>
        <div v-else class="mb-1 border-b border-gray-200 dark:border-gray-800" />

        <NuxtLink
          v-for="item in section.items"
          :key="item.id"
          :to="item.to || '/'"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="[
            item.to && isActive(item.to)
              ? 'bg-primary-500 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
            layoutStore.sidebarCollapsed ? 'justify-center' : ''
          ]"
          :title="layoutStore.sidebarCollapsed ? item.label : undefined"
        >
          <i :class="resolveMenuIcon(item.icon)" class="text-base shrink-0" />
          <span v-if="!layoutStore.sidebarCollapsed">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Bottom user area -->
    <div class="border-t border-gray-200 dark:border-gray-800 p-3">
      <div
        class="flex items-center gap-2"
        :class="layoutStore.sidebarCollapsed ? 'justify-center' : ''"
      >
        <PAvatar
          :label="userStore.displayName?.charAt(0)?.toUpperCase() || 'A'"
          shape="circle"
          class="shrink-0"
          style="width: 2rem; height: 2rem; font-size: 0.75rem;"
        />
        <div v-if="!layoutStore.sidebarCollapsed" class="min-w-0">
          <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {{ userStore.displayName || 'Admin User' }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
            {{ userStore.profile?.usrEml || 'admin@app.com' }}
          </p>
        </div>
      </div>
    </div>
  </aside>

  <!-- Mobile sidebar overlay -->
  <PDrawer
    v-model:visible="layoutStore.sidebarMobileOpen"
    position="left"
    class="lg:hidden"
    :style="{ width: '16rem' }"
    :modal="true"
  >
    <template #header>
      <AppLogo />
    </template>

    <nav class="space-y-4">
      <div v-for="section in menuSections" :key="section.title">
        <p class="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {{ section.title }}
        </p>
        <NuxtLink
          v-for="item in section.items"
          :key="item.id"
          :to="item.to || '/'"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="item.to && isActive(item.to)
            ? 'bg-primary-500 text-white'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
          @click="layoutStore.closeMobileSidebar()"
        >
          <i :class="resolveMenuIcon(item.icon)" class="text-base shrink-0" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>

    <template #footer>
      <div class="flex items-center gap-2">
        <PAvatar
          :label="userStore.displayName?.charAt(0)?.toUpperCase() || 'A'"
          shape="circle"
          style="width: 2rem; height: 2rem; font-size: 0.75rem;"
        />
        <div class="min-w-0">
          <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {{ userStore.displayName || 'Admin User' }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
            {{ userStore.profile?.usrEml || 'admin@app.com' }}
          </p>
        </div>
      </div>
    </template>
  </PDrawer>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add app/components/layout/AppSidebar.vue app/layouts/default.vue
git commit -m "refactor: migrate AppSidebar to PrimeVue with dynamic menu and PDrawer"
```

---

## Task 8: Migrate AppHeader

**Files:**
- Modify: `app/components/layout/AppHeader.vue`

- [ ] **Step 1: Replace Nuxt UI components with PrimeVue**

Replace the entire file:

```vue
<script setup lang="ts">
const layoutStore = useLayoutStore()
</script>

<template>
  <header class="sticky top-0 z-30 flex items-center h-14 px-4 gap-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
    <!-- Left: toggle + breadcrumb -->
    <PButton
      :icon="layoutStore.sidebarCollapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-left'"
      severity="secondary"
      text
      size="small"
      class="hidden lg:flex"
      @click="layoutStore.toggleSidebar()"
    />
    <PButton
      icon="pi pi-bars"
      severity="secondary"
      text
      size="small"
      class="lg:hidden"
      @click="layoutStore.toggleMobileSidebar()"
    />

    <LayoutAppBreadcrumb class="hidden md:flex" />

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Right: controls -->
    <div class="flex items-center gap-1">
      <HeaderLanguageSwitcher class="hidden md:flex" />
      <HeaderNotificationDropdown />
      <HeaderThemeToggle class="hidden md:flex" />
      <HeaderAccentColorPicker class="hidden md:flex" />

      <PDivider layout="vertical" class="hidden md:flex h-6 mx-1" />

      <HeaderUserMenu />
    </div>
  </header>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/layout/AppHeader.vue
git commit -m "refactor: migrate AppHeader to PrimeVue PButton and PDivider"
```

---

## Task 9: Migrate AppBreadcrumb

**Files:**
- Modify: `app/components/layout/AppBreadcrumb.vue`

- [ ] **Step 1: Replace UBreadcrumb with PBreadcrumb**

Replace the entire file:

```vue
<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()

const breadcrumbHome = { icon: 'pi pi-home', to: '/' }

const breadcrumbItems = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  return segments.map((segment, index) => {
    const to = '/' + segments.slice(0, index + 1).join('/')
    const key = `sidebar.${segment}`
    return {
      label: t(key, segment.charAt(0).toUpperCase() + segment.slice(1)),
      to
    }
  })
})
</script>

<template>
  <PBreadcrumb :home="breadcrumbHome" :model="breadcrumbItems" />
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/layout/AppBreadcrumb.vue
git commit -m "refactor: migrate AppBreadcrumb to PrimeVue PBreadcrumb"
```

---

## Task 10: Migrate NotificationDropdown — Fix Bubble Bug

**Files:**
- Modify: `app/components/header/NotificationDropdown.vue`

- [ ] **Step 1: Rewrite with POverlayBadge and PPopover**

Replace the entire file:

```vue
<script setup lang="ts">
const { t } = useI18n()
const notificationStore = useNotificationStore()
const op = ref()

function toggle(event: Event) {
  op.value.toggle(event)
}
</script>

<template>
  <POverlayBadge
    :value="notificationStore.unreadCount > 0 ? notificationStore.unreadCount : null"
    severity="danger"
  >
    <PButton
      icon="pi pi-bell"
      severity="secondary"
      text
      size="small"
      @click="toggle"
    />
  </POverlayBadge>

  <PPopover ref="op" appendTo="body">
    <div class="w-80">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <span class="text-sm font-semibold">{{ t('header.notifications') }}</span>
        <PButton
          v-if="notificationStore.unreadCount > 0"
          :label="t('header.markAllRead')"
          link
          size="small"
          @click="notificationStore.markAllRead()"
        />
      </div>

      <!-- List -->
      <div class="max-h-64 overflow-y-auto">
        <div
          v-for="notification in notificationStore.notifications"
          :key="notification.id"
          class="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          :class="{ 'opacity-60': notification.read }"
          @click="notificationStore.markRead(notification.id)"
        >
          <i :class="notification.icon" class="text-base text-primary-500 mt-0.5 shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="text-sm text-gray-900 dark:text-white">{{ notification.message }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ notification.time }}</p>
          </div>
          <div
            v-if="!notification.read"
            class="size-2 bg-primary-500 rounded-full mt-2 shrink-0"
          />
        </div>

        <div
          v-if="notificationStore.notifications.length === 0"
          class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          {{ t('header.noNotifications') }}
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 dark:border-gray-800 px-4 py-2">
        <PButton
          :label="t('header.viewAll')"
          link
          size="small"
          class="w-full"
        />
      </div>
    </div>
  </PPopover>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/header/NotificationDropdown.vue
git commit -m "fix: notification bubble now positions correctly using POverlayBadge"
```

---

## Task 11: Migrate UserMenu

**Files:**
- Modify: `app/components/header/UserMenu.vue`

- [ ] **Step 1: Rewrite with PMenu popup and PAvatar**

Replace the entire file:

```vue
<script setup lang="ts">
const { t } = useI18n()
const userStore = useUserStore()
const menu = ref()

const items = computed(() => [
  {
    label: t('header.profile'),
    icon: 'pi pi-user',
    command: () => {}
  },
  {
    label: t('header.settings'),
    icon: 'pi pi-cog',
    command: () => {}
  },
  {
    separator: true
  },
  {
    label: t('header.logout'),
    icon: 'pi pi-sign-out',
    command: () => userStore.logout()
  }
])

function toggle(event: Event) {
  menu.value.toggle(event)
}
</script>

<template>
  <PButton severity="secondary" text size="small" class="gap-2" @click="toggle">
    <PAvatar
      :label="userStore.displayName?.charAt(0)?.toUpperCase() || 'A'"
      shape="circle"
      style="width: 1.5rem; height: 1.5rem; font-size: 0.625rem;"
    />
    <span class="hidden md:inline text-sm font-medium">
      {{ userStore.displayName || 'Admin' }}
    </span>
  </PButton>
  <PMenu ref="menu" :model="items" :popup="true" appendTo="body" />
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/header/UserMenu.vue
git commit -m "refactor: migrate UserMenu to PrimeVue PMenu popup"
```

---

## Task 12: Migrate ThemeToggle

**Files:**
- Modify: `app/components/header/ThemeToggle.vue`

- [ ] **Step 1: Replace UButton with PButton**

Replace the entire file:

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
  <PButton
    severity="secondary"
    text
    size="small"
    :icon="colorMode.value === 'dark' ? 'pi pi-sun' : 'pi pi-moon'"
    :title="colorMode.value === 'dark' ? t('header.lightMode') : t('header.darkMode')"
    @click="toggle"
  />
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/header/ThemeToggle.vue
git commit -m "refactor: migrate ThemeToggle to PrimeVue PButton"
```

---

## Task 13: Migrate LanguageSwitcher

**Files:**
- Modify: `app/components/header/LanguageSwitcher.vue`

- [ ] **Step 1: Rewrite with PMenu popup**

Replace the entire file:

```vue
<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
const userStore = useUserStore()
const menu = ref()

const currentLocale = computed(() =>
  (locales.value as any[]).find((l: any) => l.code === locale.value)
)

const localeItems = computed(() =>
  (locales.value as any[]).map(l => ({
    label: l.name,
    command: () => {
      setLocale(l.code)
      userStore.updatePreference('locale', l.code)
    }
  }))
)

function toggle(event: Event) {
  menu.value.toggle(event)
}
</script>

<template>
  <PButton
    severity="secondary"
    text
    size="small"
    :label="currentLocale?.code?.toUpperCase()"
    icon="pi pi-globe"
    @click="toggle"
  />
  <PMenu ref="menu" :model="localeItems" :popup="true" appendTo="body" />
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/header/LanguageSwitcher.vue
git commit -m "refactor: migrate LanguageSwitcher to PrimeVue PMenu popup"
```

---

## Task 14: Migrate AccentColorPicker

**Files:**
- Modify: `app/components/header/AccentColorPicker.vue`

- [ ] **Step 1: Rewrite with PPopover**

Replace the entire file:

```vue
<script setup lang="ts">
const { t } = useI18n()
const userStore = useUserStore()
const op = ref()

const colors: { value: 'green' | 'blue' | 'purple' | 'orange'; bg: string }[] = [
  { value: 'green', bg: 'bg-green-500' },
  { value: 'blue', bg: 'bg-blue-500' },
  { value: 'purple', bg: 'bg-purple-500' },
  { value: 'orange', bg: 'bg-orange-500' }
]

function toggle(event: Event) {
  op.value.toggle(event)
}
</script>

<template>
  <PButton
    severity="secondary"
    text
    size="small"
    icon="pi pi-palette"
    :title="t('theme.accentColor')"
    @click="toggle"
  />

  <PPopover ref="op" appendTo="body">
    <div class="p-3">
      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
        {{ t('theme.accentColor') }}
      </p>
      <div class="flex gap-2">
        <button
          v-for="color in colors"
          :key="color.value"
          class="size-7 rounded-full transition-all"
          :class="[
            color.bg,
            userStore.preferences.accentColor === color.value
              ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-gray-400'
              : 'hover:scale-110'
          ]"
          :title="t(`theme.${color.value}`)"
          @click="userStore.updatePreference('accentColor', color.value)"
        />
      </div>
    </div>
  </PPopover>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/header/AccentColorPicker.vue
git commit -m "refactor: migrate AccentColorPicker to PrimeVue PPopover"
```

---

## Task 15: Migrate Login Page

**Files:**
- Modify: `app/pages/login.vue`

- [ ] **Step 1: Rewrite with PrimeVue form components**

Replace the entire file:

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
      <PCard>
        <!-- Logo + heading -->
        <template #header>
          <div class="text-center pt-6 px-6">
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
        </template>

        <template #content>
          <!-- Error message -->
          <div v-if="error" class="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {{ error }}
          </div>

          <!-- Form -->
          <form class="space-y-4" @submit.prevent="handleLogin">
            <div class="flex flex-col gap-2">
              <label for="login-email" class="text-sm font-medium">{{ t('login.email') }}</label>
              <PIconField>
                <PInputIcon class="pi pi-envelope" />
                <PInputText
                  id="login-email"
                  v-model="form.username"
                  type="text"
                  :placeholder="t('login.emailPlaceholder')"
                  class="w-full"
                  :disabled="loading"
                />
              </PIconField>
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between w-full">
                <label for="login-password" class="text-sm font-medium">{{ t('login.password') }}</label>
                <PButton
                  :label="t('login.forgotPassword')"
                  link
                  size="small"
                  class="p-0"
                />
              </div>
              <PPassword
                v-model="form.password"
                inputId="login-password"
                :placeholder="'••••••••'"
                :feedback="false"
                toggleMask
                class="w-full"
                inputClass="w-full"
                :disabled="loading"
              />
            </div>

            <div class="flex items-center gap-2">
              <PCheckbox inputId="remember-me" :binary="true" />
              <label for="remember-me" class="text-sm">{{ t('login.rememberMe') }}</label>
            </div>

            <PButton
              :label="loading ? t('login.signingIn') : t('login.signIn')"
              type="submit"
              class="w-full"
              :loading="loading"
              :disabled="loading || !form.username || !form.password"
            />
          </form>

          <!-- Language switcher -->
          <div class="mt-6 flex justify-center">
            <HeaderLanguageSwitcher />
          </div>
        </template>
      </PCard>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/pages/login.vue
git commit -m "refactor: migrate login page to PrimeVue form components"
```

---

## Task 16: Migrate Dashboard Page

**Files:**
- Modify: `app/pages/index.vue`

- [ ] **Step 1: Replace UCard with PCard**

Replace the entire file:

```vue
<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('sidebar.dashboard') }}
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Welcome back, Admin
      </p>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <PCard>
        <template #content>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">1,234</p>
        </template>
      </PCard>
      <PCard>
        <template #content>
          <p class="text-sm text-gray-500 dark:text-gray-400">Active Now</p>
          <p class="text-2xl font-bold text-primary-500 mt-1">56</p>
        </template>
      </PCard>
      <PCard>
        <template #content>
          <p class="text-sm text-gray-500 dark:text-gray-400">Programs</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">12</p>
        </template>
      </PCard>
    </div>

    <!-- Placeholder content -->
    <PCard>
      <template #content>
        <p class="text-sm text-gray-500 dark:text-gray-400">Recent Activity</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-4">
          Activity feed will be displayed here.
        </p>
      </template>
    </PCard>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/pages/index.vue
git commit -m "refactor: migrate dashboard page to PrimeVue PCard"
```

---

## Task 17: Remove Nuxt UI Package

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Uninstall @nuxt/ui**

```bash
pnpm remove @nuxt/ui
```

- [ ] **Step 2: Verify the app builds**

```bash
pnpm run build
```

If build fails, check for any remaining `U`-prefixed component references:

```bash
grep -r "UButton\|UCard\|UIcon\|UAvatar\|UPopover\|UDropdownMenu\|USlideover\|UBadge\|UBreadcrumb\|UInput\|UFormField\|UCheckbox\|USeparator\|UApp" app/
```

Fix any remaining references found.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: remove @nuxt/ui dependency — fully migrated to PrimeVue"
```

---

## Task 18: Verify and Fix Responsive Layout

- [ ] **Step 1: Start the dev server and test**

```bash
pnpm run dev
```

Check in browser:
1. Desktop (>1024px): Sidebar visible, collapses on toggle, no content overlap
2. Tablet (768-1024px): Sidebar hidden, hamburger menu shows, secondary controls hidden
3. Mobile (<768px): PDrawer opens as overlay, notification badge sits on bell icon
4. Notification bubble: Badge should be directly on the bell icon, not floating to avatar

- [ ] **Step 2: Fix any issues found and commit**

```bash
git add -A
git commit -m "fix: verify and fix responsive layout after PrimeVue migration"
```
