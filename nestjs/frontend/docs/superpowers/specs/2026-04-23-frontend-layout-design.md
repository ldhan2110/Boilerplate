# Frontend Layout & Pages Design Spec

## Summary

Build two pages for the NuxtJS frontend boilerplate: a **Login page** and a **Main layout** with header, collapsible sidebar, multi-language support, notifications, accent color themes, and dark/light mode. All components are reusable and responsive.

## Tech Stack

- **Nuxt 4** with app directory structure
- **@nuxt/ui v4** — primary component library for layout shell
- **PrimeVue v4** (prefix `P`) — reserved for data-heavy components (DataTable, etc.), styled to match @nuxt/ui via shared Aura theme + CSS custom properties
- **Tailwind CSS v4** — utility styling
- **Pinia** — state management (sidebar state, theme preferences, notifications)
- **@nuxtjs/i18n** — multi-language (English, Vietnamese)

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Sidebar style | Collapsible (toggle) | Full labels when expanded, icon-only rail when collapsed. User-controlled. |
| Login style | Centered card | Clean, minimal, universal. Light background. |
| Header layout | Single row flat | Toggle + breadcrumb left, controls right. No search bar. |
| Theme system | Dark/light + accent colors | 4 accent presets (green, blue, purple, orange). `useColorMode()` for dark/light. |
| Notifications | Simple dropdown list | Icon + message + time. Mark-all-read + view-all link. Placeholder for API. |
| Primary UI lib | @nuxt/ui for shell | PrimeVue for future data components only. Consistent styling via shared tokens. |

## Pages

### 1. Login Page (`/login`)

- **Route**: `/login` — no layout (standalone page)
- **Structure**: Centered card on subtle gradient background
- **Elements**:
  - App logo + "Welcome back" heading + subtitle
  - Email input field
  - Password input field with "Forgot password?" link
  - "Remember me" checkbox
  - "Sign in" submit button (primary color)
  - Language switcher at bottom (minimal, dropdown)
- **Responsive**: Card takes full width on mobile with padding, max-width 400px on desktop
- **No auth logic**: Just the UI template — form submission is a placeholder

### 2. Main Layout (`/`)

Uses a `default.vue` layout with three zones: sidebar, header, content.

#### Sidebar (`AppSidebar.vue`)

- **Expanded state**: 240px wide, shows icon + text labels, grouped menu sections with uppercase section headers
- **Collapsed state**: 64px wide, icon-only rail with tooltips on hover
- **Toggle**: Controlled via header toggle button, persisted in Pinia store
- **Menu items**: Configurable array of `{ icon, label, to, section }` — easy to extend
- **Bottom area**: User info (avatar + name + email) when expanded, avatar-only when collapsed
- **Mobile**: Sidebar renders as an overlay drawer with backdrop, close button. Toggle via hamburger in header.
- **Transition**: Smooth width transition (`transition-all duration-300`)

#### Header (`AppHeader.vue`)

- **Left side**: Sidebar toggle button (hamburger icon) + breadcrumb (auto-generated from route)
- **Right side** (left to right):
  - `LanguageSwitcher.vue` — dropdown showing current locale flag/code, switches between en/vi
  - `NotificationDropdown.vue` — bell icon with badge count, dropdown panel with notification list
  - `ThemeToggle.vue` — sun/moon icon to toggle dark/light mode
  - `AccentColorPicker.vue` — small color dot/button, dropdown with 4 accent swatches
  - Vertical divider
  - `UserMenu.vue` — avatar + dropdown (profile, settings, logout)
- **Mobile**: Compact header — hamburger + page title + bell + avatar only. Other controls move to sidebar bottom or user menu.

## Reusable Components

### Layout Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `AppSidebar.vue` | `components/layout/` | Collapsible sidebar with menu |
| `AppHeader.vue` | `components/layout/` | Top header bar |
| `AppBreadcrumb.vue` | `components/layout/` | Auto breadcrumb from route |
| `AppLogo.vue` | `components/` | Shared logo (login + sidebar) |

### Header Widgets
| Component | Location | Purpose |
|-----------|----------|---------|
| `LanguageSwitcher.vue` | `components/header/` | i18n locale dropdown |
| `NotificationDropdown.vue` | `components/header/` | Bell + notification list |
| `ThemeToggle.vue` | `components/header/` | Dark/light mode toggle |
| `AccentColorPicker.vue` | `components/header/` | Accent color selection |
| `UserMenu.vue` | `components/header/` | Avatar + user dropdown |

## Stores (Pinia)

### `useLayoutStore`
```ts
{
  sidebarCollapsed: boolean    // toggle sidebar expanded/collapsed
  sidebarMobileOpen: boolean   // mobile overlay state
  toggleSidebar(): void
  toggleMobileSidebar(): void
}
```

### `useThemeStore`
```ts
{
  accentColor: 'green' | 'blue' | 'purple' | 'orange'
  setAccentColor(color: string): void
}
```
Persisted to `localStorage`. Dark/light mode handled by `useColorMode()` from @nuxt/ui.

### `useNotificationStore`
```ts
{
  notifications: Notification[]   // { id, icon, message, time, read }
  unreadCount: computed<number>
  markAllRead(): void
  markRead(id: string): void
}
```
Seeded with mock data. Ready for API integration.

## i18n Structure

```
frontend/
  locales/
    en.json    # English translations
    vi.json    # Vietnamese translations
```

Translation keys organized by page/component:
```json
{
  "login": {
    "welcome": "Welcome back",
    "subtitle": "Sign in to your account",
    "email": "Email",
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
    "noNotifications": "No notifications",
    "darkMode": "Dark mode",
    "lightMode": "Light mode",
    "profile": "Profile",
    "logout": "Log out"
  }
}
```

## Theme & Styling Consistency

### Accent Color System
- 4 presets: green (default), blue, purple, orange
- Implemented by updating `app.config.ts` `ui.colors.primary` dynamically or via CSS custom properties
- Both @nuxt/ui and PrimeVue Aura theme consume the same CSS custom properties for primary color
- Border radius, font family, and spacing tokens shared between both libraries

### Dark/Light Mode
- `useColorMode()` from @nuxt/ui — toggles `dark` class on `<html>`
- PrimeVue Aura theme has built-in dark mode support via `darkModeSelector: '.dark'`
- Tailwind dark mode via `dark:` prefix (inherited from @nuxt/ui setup)

### PrimeVue Visual Alignment
- Configure PrimeVue Aura preset to use the same primary color CSS variables as @nuxt/ui
- Match border-radius tokens: `--p-border-radius` aligned to Tailwind's rounded values
- Same font family (`Public Sans`) applied globally

## Responsive Breakpoints

| Breakpoint | Sidebar | Header | Content |
|------------|---------|--------|---------|
| Desktop (≥1024px) | Persistent, collapsible | Full controls | Beside sidebar |
| Tablet (768-1023px) | Collapsed by default | Full controls | Full width |
| Mobile (<768px) | Overlay drawer | Compact (hamburger + title + bell + avatar) | Full width |

## File Structure

```
frontend/app/
├── layouts/
│   └── default.vue              # Main layout (sidebar + header + slot)
├── pages/
│   ├── index.vue                # Dashboard / main page
│   └── login.vue                # Login page (no layout)
├── components/
│   ├── AppLogo.vue              # Shared logo
│   ├── layout/
│   │   ├── AppSidebar.vue       # Collapsible sidebar
│   │   ├── AppHeader.vue        # Top header bar
│   │   └── AppBreadcrumb.vue    # Route breadcrumb
│   └── header/
│       ├── LanguageSwitcher.vue  # i18n locale dropdown
│       ├── NotificationDropdown.vue
│       ├── ThemeToggle.vue      # Dark/light toggle
│       ├── AccentColorPicker.vue
│       └── UserMenu.vue         # Avatar + dropdown menu
├── stores/
│   ├── layout.ts                # Sidebar state
│   ├── theme.ts                 # Accent color preference
│   └── notification.ts          # Mock notifications
├── locales/
│   ├── en.json
│   └── vi.json
└── assets/css/
    └── main.css                 # Tailwind + theme token overrides
```

## Out of Scope

- Authentication logic (login form is UI only)
- API integration for notifications
- Registration / forgot password pages
- Dashboard content (just placeholder cards)
- Role-based menu visibility
