# PrimeVue Migration, API Layer Refactoring & Layout Fixes

**Date:** 2026-04-24
**Status:** Approved
**Scope:** Full Nuxt UI → PrimeVue migration, apiClient/useApi separation, responsive layout & notification bubble fixes

---

## 1. API Layer Refactoring

### 1.1 File Structure

```
app/
  services/
    apiClient.ts        # Plain ofetch wrapper — token injection + interceptors
  composables/
    useApi.ts           # Vue-reactive wrapper — loading, error, data refs
```

### 1.2 `services/apiClient.ts`

A non-composable HTTP client using `ofetch`. Can be imported anywhere (stores, middleware, components).

**Responsibilities:**
- Configured `ofetch` instance with `baseURL` from runtime config
- Request interceptor: injects `Authorization: Bearer <token>` from user store
- Response interceptor: catches 401, attempts token refresh via user store, retries once, then redirects to `/login`
- Exports typed methods: `apiClient.get<T>()`, `apiClient.post<T>()`, `apiClient.patch<T>()`, `apiClient.put<T>()`, `apiClient.delete<T>()`

### 1.3 `composables/useApi.ts`

A Vue composable wrapping `apiClient` for reactive data fetching in components.

**Returns:** `{ data: Ref<T>, error: Ref<Error | null>, loading: Ref<boolean>, execute: () => Promise<void> }`

- `execute()` must be called explicitly — no auto-fetch on mount (keeps behavior predictable for the team)
- Supports all HTTP methods via options: `useApi<T>(url, { method: 'POST', body: {...} })`

**Usage pattern:**
```ts
// In a store or middleware (non-reactive)
import { apiClient } from '~/services/apiClient'
const users = await apiClient.get<User[]>('/api/users')

// In a component (reactive)
const { data, loading, error, execute } = useApi<User[]>('/api/users')
```

---

## 2. PrimeVue Component Migration

### 2.1 Nuxt Config Changes

- Remove `@nuxt/ui` from `modules`
- Remove `app.config.ts` (Nuxt UI color config)
- Keep `@primevue/nuxt-module` with existing Aura theme config
- Keep Tailwind CSS for layout/spacing — PrimeVue handles component styling
- Keep `primeicons/primeicons.css` in CSS array

### 2.2 Component Mapping

| Component | Nuxt UI | PrimeVue |
|-----------|---------|----------|
| `app.vue` | `UApp` | Remove wrapper, add `PToast` |
| `AppSidebar` (desktop) | `UIcon`, `UAvatar` | `PPanelMenu`, `PAvatar`, PrimeIcons |
| `AppSidebar` (mobile) | `USlideover` | `PDrawer` |
| `AppHeader` | `UButton`, `USeparator` | `PButton`, `PDivider` |
| `AppBreadcrumb` | `UBreadcrumb` | `PBreadcrumb` with `model` prop |
| `NotificationDropdown` | `UPopover`, `UBadge`, `UButton` | `POverlayBadge` + `PPopover` + `PButton` |
| `UserMenu` | `UDropdownMenu`, `UButton`, `UAvatar` | `PMenu` (popup) + `PButton` + `PAvatar` |
| `ThemeToggle` | `UButton` | `PButton` |
| `LanguageSwitcher` | `UDropdownMenu`, `UButton` | `PMenu` (popup) + `PButton` |
| `AccentColorPicker` | `UPopover`, `UButton` | `PPopover` + `PButton` |
| `AppLogo` | None | Unchanged |
| `login.vue` | `UCard`, `UInput`, `UFormField`, `UCheckbox`, `UButton` | `PCard`, `PInputText`, `PPassword`, `PFloatLabel`, `PCheckbox`, `PButton` |
| `index.vue` | `UCard` | `PCard` |

### 2.3 Icon Strategy

Replace Lucide icon classes (`i-lucide-*`) with PrimeIcons (`pi pi-*`). PrimeIcons are already installed.

### 2.4 Dynamic Sidebar Menu

Menu items are fetched from the backend API and rendered dynamically.

**Menu data shape:**
```ts
interface MenuItem {
  id: string
  label: string
  icon?: string        // key mapped to PrimeIcon via constants
  to?: string          // route path (leaf items)
  children?: MenuItem[] // nested items
}
```

**Icon mapping constants** in `utils/constants/menuIcons.ts`:
```ts
export const MENU_ICONS: Record<string, string> = {
  dashboard: 'pi pi-objects-column',
  users: 'pi pi-users',
  settings: 'pi pi-cog',
  shield: 'pi pi-shield',
  clipboard: 'pi pi-clipboard',
  // team extends as needed
}
```

Parent items display icons. The sidebar uses `PPanelMenu` which supports nested expand/collapse natively.

### 2.5 Dropdown Menus

`UserMenu` and `LanguageSwitcher` use `PMenu` with `popup` mode:
```ts
const menu = ref()
const toggle = (event: Event) => menu.value.toggle(event)
```

---

## 3. Responsive Layout & Bug Fixes

### 3.1 Sidebar Overlap Fix

- Desktop sidebar: add `flex-shrink-0` to prevent compression into main content during `w-16`/`w-60` transition
- Mobile sidebar: `PDrawer` replaces `USlideover` — built-in overlay/backdrop handling eliminates overlap

### 3.2 Notification Bubble Fix

**Root cause:** `UBadge` with `absolute -top-1 -right-1` inside `UButton`'s `#trailing` slot. The button's trailing container lacks `position: relative`, so the badge escapes to the nearest positioned ancestor in the header, landing near the avatar.

**Fix:** Replace with `POverlayBadge` wrapping the bell `PButton`. PrimeVue handles badge positioning internally — no manual absolute positioning needed.

### 3.3 Header Responsive Behavior

- Breakpoint strategy unchanged: `hidden md:flex` for secondary controls (language, theme, accent), always-visible for notifications and user menu
- `USeparator` → `PDivider` (vertical orientation, same visibility rules)
- `PMenu` popups use `appendTo="body"` to prevent viewport overflow on mobile

### 3.4 Layout Structure (Unchanged)

```
┌──────────────────────────────────────┐
│  Header (sticky, z-30, h-14)         │
├────────────┬─────────────────────────┤
│  Sidebar   │  Main content           │
│  shrink-0  │  flex-1 min-w-0         │
│  lg:flex   │  p-4 lg:p-6             │
└────────────┴─────────────────────────┘
```

---

## 4. Migration Order

1. **API layer** — `services/apiClient.ts` + refactored `useApi.ts` (independent of UI)
2. **Menu constants** — `utils/constants/menuIcons.ts`
3. **Core layout** — `app.vue`, `default.vue`, `AppSidebar`, `AppHeader`
4. **Header components** — `NotificationDropdown`, `UserMenu`, `ThemeToggle`, `LanguageSwitcher`, `AccentColorPicker`, `AppBreadcrumb`
5. **Pages** — `login.vue`, `index.vue`
6. **Cleanup** — Remove `@nuxt/ui` from modules, uninstall package, remove `app.config.ts`

---

## 5. Packages to Remove

- `@nuxt/ui`

## 6. Packages Already Installed (No Changes)

- `primevue` ^4.5.5
- `@primevue/nuxt-module` ^4.5.5
- `@primeuix/themes` ^2.0.3
- `primeicons` ^7.0.0
