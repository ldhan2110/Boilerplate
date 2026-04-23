# Frontend Layout & Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a login page and main dashboard layout with collapsible sidebar, header controls (lang, notifications, theme, user menu), responsive design, and i18n support.

**Architecture:** Two-page app — standalone login page (centered card, no layout) and a `default.vue` layout wrapping the dashboard with `AppSidebar` + `AppHeader` + content slot. State managed via Pinia stores. Theme uses @nuxt/ui `useColorMode()` for dark/light and a custom `useThemeStore` for accent colors. All text i18n'd via `@nuxtjs/i18n`.

**Tech Stack:** Nuxt 4, @nuxt/ui v4, PrimeVue v4 (Aura preset, prefix `P`), Tailwind CSS v4, Pinia, @nuxtjs/i18n

---

### Task 1: i18n Locale Files + Cleanup Default Scaffolding

**Files:**
- Create: `frontend/app/locales/en.json`
- Create: `frontend/app/locales/vi.json`
- Modify: `frontend/app/app.vue`
- Delete: `frontend/app/components/TemplateMenu.vue`
- Modify: `frontend/nuxt.config.ts`

- [ ] **Step 1: Create English locale file**

Create `frontend/app/locales/en.json`:

```json
{
  "app": {
    "name": "Boilerplate"
  },
  "login": {
    "welcome": "Welcome back",
    "subtitle": "Sign in to your account",
    "email": "Email",
    "emailPlaceholder": "you@example.com",
    "password": "Password",
    "forgotPassword": "Forgot password?",
    "rememberMe": "Remember me",
    "signIn": "Sign in"
  },
  "sidebar": {
    "main": "Main",
    "admin": "Admin",
    "dashboard": "Dashboard",
    "users": "Users",
    "settings": "Settings",
    "roles": "Roles",
    "programs": "Programs"
  },
  "header": {
    "notifications": "Notifications",
    "markAllRead": "Mark all read",
    "viewAll": "View all",
    "noNotifications": "No new notifications",
    "darkMode": "Dark mode",
    "lightMode": "Light mode",
    "profile": "Profile",
    "settings": "Settings",
    "logout": "Log out"
  },
  "theme": {
    "accentColor": "Accent color",
    "green": "Green",
    "blue": "Blue",
    "purple": "Purple",
    "orange": "Orange"
  }
}
```

- [ ] **Step 2: Create Vietnamese locale file**

Create `frontend/app/locales/vi.json`:

```json
{
  "app": {
    "name": "Boilerplate"
  },
  "login": {
    "welcome": "Chào mừng trở lại",
    "subtitle": "Đăng nhập vào tài khoản của bạn",
    "email": "Email",
    "emailPlaceholder": "you@example.com",
    "password": "Mật khẩu",
    "forgotPassword": "Quên mật khẩu?",
    "rememberMe": "Ghi nhớ đăng nhập",
    "signIn": "Đăng nhập"
  },
  "sidebar": {
    "main": "Chính",
    "admin": "Quản trị",
    "dashboard": "Bảng điều khiển",
    "users": "Người dùng",
    "settings": "Cài đặt",
    "roles": "Vai trò",
    "programs": "Chương trình"
  },
  "header": {
    "notifications": "Thông báo",
    "markAllRead": "Đánh dấu đã đọc",
    "viewAll": "Xem tất cả",
    "noNotifications": "Không có thông báo mới",
    "darkMode": "Chế độ tối",
    "lightMode": "Chế độ sáng",
    "profile": "Hồ sơ",
    "settings": "Cài đặt",
    "logout": "Đăng xuất"
  },
  "theme": {
    "accentColor": "Màu chủ đạo",
    "green": "Xanh lá",
    "blue": "Xanh dương",
    "purple": "Tím",
    "orange": "Cam"
  }
}
```

- [ ] **Step 3: Update i18n config to use app/locales directory**

In `frontend/nuxt.config.ts`, update the `i18n` block to point `langDir` at the app-relative locales:

```ts
i18n: {
  locales: [
    { code: 'en', name: 'English', file: 'en.json' },
    { code: 'vi', name: 'Tiếng Việt', file: 'vi.json' }
  ],
  defaultLocale: 'en',
  langDir: 'app/locales'
},
```

Also add `darkModeSelector` to the PrimeVue options so PrimeVue respects @nuxt/ui's dark mode class:

```ts
primevue: {
  autoImport: true,
  components: {
    prefix: 'P'
  },
  composables: {
    exclude: ['useToast']
  },
  options: {
    ripple: true,
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: '.dark'
      }
    }
  }
},
```

- [ ] **Step 4: Clean up app.vue — strip default starter template**

Replace `frontend/app/app.vue` with a minimal shell:

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
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
```

- [ ] **Step 5: Delete TemplateMenu.vue**

Delete `frontend/app/components/TemplateMenu.vue` — it's default Nuxt starter scaffolding no longer needed.

- [ ] **Step 6: Verify app starts**

Run: `cd frontend && pnpm dev`

Expected: App starts without errors. The page will be blank (no layout or page content yet), but no console errors about missing locale files or broken imports.

- [ ] **Step 7: Commit**

```bash
git add frontend/app/locales/ frontend/app/app.vue frontend/nuxt.config.ts
git rm frontend/app/components/TemplateMenu.vue
git commit -m "feat: add i18n locale files and clean up default scaffolding"
```

---

### Task 2: Pinia Stores (layout, theme, notification)

**Files:**
- Create: `frontend/app/stores/layout.ts`
- Create: `frontend/app/stores/theme.ts`
- Create: `frontend/app/stores/notification.ts`
- Delete: `frontend/app/stores/example.ts`

- [ ] **Step 1: Create layout store**

Create `frontend/app/stores/layout.ts`:

```ts
export const useLayoutStore = defineStore('layout', () => {
  const sidebarCollapsed = ref(false)
  const sidebarMobileOpen = ref(false)

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
```

- [ ] **Step 2: Create theme store**

Create `frontend/app/stores/theme.ts`:

```ts
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
```

- [ ] **Step 3: Create notification store**

Create `frontend/app/stores/notification.ts`:

```ts
export interface AppNotification {
  id: string
  icon: string
  message: string
  time: string
  read: boolean
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<AppNotification[]>([
    {
      id: '1',
      icon: 'i-lucide-user-plus',
      message: 'New user registered: John Doe',
      time: '5 min ago',
      read: false
    },
    {
      id: '2',
      icon: 'i-lucide-shield-check',
      message: 'Role "Editor" was updated',
      time: '1 hour ago',
      read: false
    },
    {
      id: '3',
      icon: 'i-lucide-settings',
      message: 'System settings changed',
      time: '3 hours ago',
      read: true
    }
  ])

  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.read).length
  )

  function markAllRead() {
    notifications.value.forEach(n => n.read = true)
  }

  function markRead(id: string) {
    const n = notifications.value.find(n => n.id === id)
    if (n) n.read = true
  }

  return { notifications, unreadCount, markAllRead, markRead }
})
```

- [ ] **Step 4: Delete example store**

Delete `frontend/app/stores/example.ts`.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/stores/layout.ts frontend/app/stores/theme.ts frontend/app/stores/notification.ts
git rm frontend/app/stores/example.ts
git commit -m "feat: add layout, theme, and notification Pinia stores"
```

---

### Task 3: AppLogo Component

**Files:**
- Modify: `frontend/app/components/AppLogo.vue`

- [ ] **Step 1: Rewrite AppLogo**

Replace the empty `frontend/app/components/AppLogo.vue` with a simple branded logo component that accepts a `collapsed` prop for sidebar use:

```vue
<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <div class="flex items-center gap-2.5">
    <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-sm">
      B
    </div>
    <span
      v-if="!collapsed"
      class="text-sm font-bold text-gray-900 dark:text-white truncate"
    >
      {{ t('app.name') }}
    </span>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/components/AppLogo.vue
git commit -m "feat: rewrite AppLogo with branded icon and collapse support"
```

---

### Task 4: Theme Plugin (Accent Color Application)

**Files:**
- Create: `frontend/app/plugins/theme.client.ts`
- Modify: `frontend/app/app.config.ts`

- [ ] **Step 1: Create theme client plugin**

This plugin initializes the theme store and watches the accent color to dynamically update `useAppConfig().ui.colors.primary`:

Create `frontend/app/plugins/theme.client.ts`:

```ts
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
```

- [ ] **Step 2: Update app.config.ts**

Replace `frontend/app/app.config.ts`:

```ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate'
    }
  }
})
```

(This is already the current content, but confirming it stays as the default. The plugin overrides `primary` at runtime.)

- [ ] **Step 3: Commit**

```bash
git add frontend/app/plugins/theme.client.ts frontend/app/app.config.ts
git commit -m "feat: add theme plugin for dynamic accent color switching"
```

---

### Task 5: Layout Components — AppBreadcrumb + AppSidebar

**Files:**
- Create: `frontend/app/components/layout/AppBreadcrumb.vue`
- Create: `frontend/app/components/layout/AppSidebar.vue`

- [ ] **Step 1: Create AppBreadcrumb**

Create `frontend/app/components/layout/AppBreadcrumb.vue`:

```vue
<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()

const breadcrumbs = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  if (segments.length === 0) {
    return [{ label: t('sidebar.dashboard'), to: '/' }]
  }
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
  <UBreadcrumb :items="breadcrumbs" />
</template>
```

- [ ] **Step 2: Create AppSidebar**

Create `frontend/app/components/layout/AppSidebar.vue`:

```vue
<script setup lang="ts">
const { t } = useI18n()
const layoutStore = useLayoutStore()
const route = useRoute()

const menuSections = computed(() => [
  {
    title: t('sidebar.main'),
    items: [
      { icon: 'i-lucide-layout-dashboard', label: t('sidebar.dashboard'), to: '/' },
      { icon: 'i-lucide-users', label: t('sidebar.users'), to: '/users' },
      { icon: 'i-lucide-settings', label: t('sidebar.settings'), to: '/settings' }
    ]
  },
  {
    title: t('sidebar.admin'),
    items: [
      { icon: 'i-lucide-shield', label: t('sidebar.roles'), to: '/roles' },
      { icon: 'i-lucide-clipboard-list', label: t('sidebar.programs'), to: '/programs' }
    ]
  }
])

function isActive(to: string) {
  return route.path === to
}
</script>

<template>
  <!-- Desktop sidebar -->
  <aside
    class="hidden lg:flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 h-screen sticky top-0"
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
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="[
            isActive(item.to)
              ? 'bg-primary-500 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
            layoutStore.sidebarCollapsed ? 'justify-center' : ''
          ]"
          :title="layoutStore.sidebarCollapsed ? item.label : undefined"
        >
          <UIcon :name="item.icon" class="size-5 shrink-0" />
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
        <UAvatar
          src=""
          alt="Admin"
          :ui="{ fallback: 'bg-primary-500 text-white text-xs font-semibold' }"
          size="sm"
          text="A"
        />
        <div v-if="!layoutStore.sidebarCollapsed" class="min-w-0">
          <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">Admin User</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">admin@app.com</p>
        </div>
      </div>
    </div>
  </aside>

  <!-- Mobile sidebar overlay -->
  <USlideover
    v-model:open="layoutStore.sidebarMobileOpen"
    side="left"
    class="lg:hidden"
    :ui="{ width: 'max-w-64' }"
  >
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-800">
        <AppLogo />
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="layoutStore.closeMobileSidebar()"
        />
      </div>

      <!-- Menu -->
      <nav class="flex-1 overflow-y-auto p-2 space-y-4">
        <div v-for="section in menuSections" :key="section.title">
          <p class="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {{ section.title }}
          </p>
          <NuxtLink
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
            :class="isActive(item.to)
              ? 'bg-primary-500 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            @click="layoutStore.closeMobileSidebar()"
          >
            <UIcon :name="item.icon" class="size-5 shrink-0" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </div>
      </nav>

      <!-- Bottom user area -->
      <div class="border-t border-gray-200 dark:border-gray-800 p-3">
        <div class="flex items-center gap-2">
          <UAvatar
            src=""
            alt="Admin"
            :ui="{ fallback: 'bg-primary-500 text-white text-xs font-semibold' }"
            size="sm"
            text="A"
          />
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">Admin User</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">admin@app.com</p>
          </div>
        </div>
      </div>
    </div>
  </USlideover>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/components/layout/
git commit -m "feat: add AppBreadcrumb and AppSidebar components"
```

---

### Task 6: Header Widget Components

**Files:**
- Create: `frontend/app/components/header/LanguageSwitcher.vue`
- Create: `frontend/app/components/header/NotificationDropdown.vue`
- Create: `frontend/app/components/header/ThemeToggle.vue`
- Create: `frontend/app/components/header/AccentColorPicker.vue`
- Create: `frontend/app/components/header/UserMenu.vue`

- [ ] **Step 1: Create LanguageSwitcher**

Create `frontend/app/components/header/LanguageSwitcher.vue`:

```vue
<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const currentLocale = computed(() =>
  locales.value.find((l: any) => l.code === locale.value)
)

const localeItems = computed(() =>
  (locales.value as any[]).map(l => ({
    label: l.name,
    click: () => setLocale(l.code)
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

- [ ] **Step 2: Create NotificationDropdown**

Create `frontend/app/components/header/NotificationDropdown.vue`:

```vue
<script setup lang="ts">
const { t } = useI18n()
const notificationStore = useNotificationStore()
const open = ref(false)
</script>

<template>
  <UPopover v-model:open="open">
    <UButton
      color="neutral"
      variant="ghost"
      size="sm"
      icon="i-lucide-bell"
    >
      <template #trailing>
        <UBadge
          v-if="notificationStore.unreadCount > 0"
          :label="notificationStore.unreadCount"
          size="xs"
          color="red"
          class="absolute -top-1 -right-1 size-5 justify-center rounded-full p-0"
        />
      </template>
    </UButton>

    <template #content>
      <div class="w-80">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <span class="text-sm font-semibold">{{ t('header.notifications') }}</span>
          <UButton
            v-if="notificationStore.unreadCount > 0"
            :label="t('header.markAllRead')"
            variant="link"
            size="xs"
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
            <UIcon :name="notification.icon" class="size-5 text-primary-500 mt-0.5 shrink-0" />
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
          <UButton
            :label="t('header.viewAll')"
            variant="link"
            size="sm"
            block
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
```

- [ ] **Step 3: Create ThemeToggle**

Create `frontend/app/components/header/ThemeToggle.vue`:

```vue
<script setup lang="ts">
const { t } = useI18n()
const colorMode = useColorMode()

function toggle() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
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

- [ ] **Step 4: Create AccentColorPicker**

Create `frontend/app/components/header/AccentColorPicker.vue`:

```vue
<script setup lang="ts">
const { t } = useI18n()
const themeStore = useThemeStore()

const colors: { value: 'green' | 'blue' | 'purple' | 'orange'; bg: string }[] = [
  { value: 'green', bg: 'bg-green-500' },
  { value: 'blue', bg: 'bg-blue-500' },
  { value: 'purple', bg: 'bg-purple-500' },
  { value: 'orange', bg: 'bg-orange-500' }
]
</script>

<template>
  <UPopover>
    <UButton
      color="neutral"
      variant="ghost"
      size="sm"
      icon="i-lucide-palette"
      :title="t('theme.accentColor')"
    />

    <template #content>
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
              themeStore.accentColor === color.value
                ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-gray-400'
                : 'hover:scale-110'
            ]"
            :title="t(`theme.${color.value}`)"
            @click="themeStore.setAccentColor(color.value)"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
```

- [ ] **Step 5: Create UserMenu**

Create `frontend/app/components/header/UserMenu.vue`:

```vue
<script setup lang="ts">
const { t } = useI18n()

const items = computed(() => [
  {
    label: t('header.profile'),
    icon: 'i-lucide-user',
    click: () => {}
  },
  {
    label: t('header.settings'),
    icon: 'i-lucide-settings',
    click: () => {}
  },
  {
    label: t('header.logout'),
    icon: 'i-lucide-log-out',
    click: () => {}
  }
])
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton color="neutral" variant="ghost" size="sm" class="gap-2">
      <UAvatar
        src=""
        alt="Admin"
        :ui="{ fallback: 'bg-primary-500 text-white text-xs font-semibold' }"
        size="xs"
        text="A"
      />
      <span class="hidden md:inline text-sm font-medium">Admin</span>
    </UButton>
  </UDropdownMenu>
</template>
```

- [ ] **Step 6: Commit**

```bash
git add frontend/app/components/header/
git commit -m "feat: add header widget components (lang, notifications, theme, accent, user)"
```

---

### Task 7: AppHeader Component

**Files:**
- Create: `frontend/app/components/layout/AppHeader.vue`

- [ ] **Step 1: Create AppHeader**

Create `frontend/app/components/layout/AppHeader.vue`:

```vue
<script setup lang="ts">
const layoutStore = useLayoutStore()
</script>

<template>
  <header class="sticky top-0 z-30 flex items-center h-14 px-4 gap-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
    <!-- Left: toggle + breadcrumb -->
    <UButton
      :icon="layoutStore.sidebarCollapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
      color="neutral"
      variant="ghost"
      size="sm"
      class="hidden lg:flex"
      @click="layoutStore.toggleSidebar()"
    />
    <UButton
      icon="i-lucide-menu"
      color="neutral"
      variant="ghost"
      size="sm"
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

      <USeparator orientation="vertical" class="hidden md:flex h-6 mx-1" />

      <HeaderUserMenu />
    </div>
  </header>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/components/layout/AppHeader.vue
git commit -m "feat: add AppHeader component with all header controls"
```

---

### Task 8: Default Layout + Pages (Login + Dashboard)

**Files:**
- Create: `frontend/app/layouts/default.vue`
- Create: `frontend/app/pages/login.vue`
- Modify: `frontend/app/pages/index.vue`

- [ ] **Step 1: Create default layout**

Create `frontend/app/layouts/default.vue`:

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

- [ ] **Step 2: Create login page (no layout)**

Create `frontend/app/pages/login.vue`:

```vue
<script setup lang="ts">
definePageMeta({
  layout: false
})

const { t } = useI18n()
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
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

        <!-- Form -->
        <form @submit.prevent class="space-y-4">
          <UFormField :label="t('login.email')">
            <UInput
              type="email"
              :placeholder="t('login.emailPlaceholder')"
              icon="i-lucide-mail"
              size="lg"
              class="w-full"
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
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <div class="flex items-center gap-2">
            <UCheckbox :label="t('login.rememberMe')" />
          </div>

          <UButton
            :label="t('login.signIn')"
            type="submit"
            block
            size="lg"
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

- [ ] **Step 3: Replace index.vue with dashboard placeholder**

Replace `frontend/app/pages/index.vue`:

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
      <UCard>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">1,234</p>
        </div>
      </UCard>
      <UCard>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Active Now</p>
          <p class="text-2xl font-bold text-primary-500 mt-1">56</p>
        </div>
      </UCard>
      <UCard>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Programs</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">12</p>
        </div>
      </UCard>
    </div>

    <!-- Placeholder content -->
    <UCard>
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">Recent Activity</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-4">
          Activity feed will be displayed here.
        </p>
      </div>
    </UCard>
  </div>
</template>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/app/layouts/default.vue frontend/app/pages/login.vue frontend/app/pages/index.vue
git commit -m "feat: add default layout, login page, and dashboard placeholder"
```

---

### Task 9: CSS Theme Tokens + Final Verification

**Files:**
- Modify: `frontend/app/assets/css/main.css`

- [ ] **Step 1: Update main.css with PrimeVue alignment tokens**

Replace `frontend/app/assets/css/main.css`:

```css
@import "tailwindcss";
@import "@nuxt/ui";

@theme static {
  --font-sans: 'Public Sans', sans-serif;

  --color-green-50: #EFFDF5;
  --color-green-100: #D9FBE8;
  --color-green-200: #B3F5D1;
  --color-green-300: #75EDAE;
  --color-green-400: #00DC82;
  --color-green-500: #00C16A;
  --color-green-600: #00A155;
  --color-green-700: #007F45;
  --color-green-800: #016538;
  --color-green-900: #0A5331;
  --color-green-950: #052E16;
}

/* Sidebar transitions */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 0.3s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(-100%);
}
```

- [ ] **Step 2: Verify the full app**

Run: `cd frontend && pnpm dev`

Verification checklist:
1. Visit `/login` — centered card with email/password form, language switcher
2. Visit `/` — sidebar + header + dashboard content
3. Click sidebar toggle — collapses to icon-only rail, expands back
4. Resize to mobile — sidebar becomes overlay, header becomes compact
5. Switch language via dropdown — all text updates
6. Toggle dark/light mode — entire app switches theme
7. Pick accent color — primary color updates across all components
8. Click notification bell — dropdown shows mock notifications
9. Click user menu — shows profile/settings/logout options

- [ ] **Step 3: Commit**

```bash
git add frontend/app/assets/css/main.css
git commit -m "feat: update CSS theme tokens and sidebar transitions"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | i18n locales + cleanup scaffolding | 5 files |
| 2 | Pinia stores (layout, theme, notification) | 4 files |
| 3 | AppLogo rewrite | 1 file |
| 4 | Theme plugin (accent color) | 2 files |
| 5 | AppBreadcrumb + AppSidebar | 2 files |
| 6 | Header widgets (5 components) | 5 files |
| 7 | AppHeader | 1 file |
| 8 | Default layout + Login + Dashboard pages | 3 files |
| 9 | CSS tokens + final verification | 1 file |

**Total: 9 tasks, 24 files created/modified**
