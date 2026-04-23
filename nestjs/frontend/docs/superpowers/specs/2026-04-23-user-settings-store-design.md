# User Settings Store — Design Spec

**Date:** 2026-04-23
**Scope:** Persistent user settings store for NuxtJS frontend boilerplate

## Overview

A unified Pinia store (`useUserStore`) that manages authentication state, user profile, and UI preferences with persistence and backend sync. Replaces the existing `theme.ts` store.

## Requirements

- Store auth tokens (access in memory, refresh in localStorage)
- Persist and restore user session across browser close/reopen
- Store user profile from backend
- Persist UI preferences (locale, dark mode, accent color, date format) to localStorage
- Two-way sync preferences with backend user fields
- Auto-refresh access token before expiry
- Route protection via global middleware

## Architecture

### Storage Strategy

| Data | Storage | Reason |
|------|---------|--------|
| Access token | Pinia memory only | Never touches persistent storage; best XSS mitigation |
| Refresh token | localStorage (`app_refresh_token`) | Survives page refresh for session restore |
| User profile | localStorage (`app_user_profile`) | Quick restore on init, refreshed from backend |
| UI preferences | localStorage (`app_user_preferences`) | Instant apply, synced to backend with debounce |

### State Shape

```typescript
interface UserState {
  // Auth (in-memory only)
  accessToken: string | null
  accessExpireIn: number | null

  // Profile (from GET /api/auth/me)
  profile: UserProfile | null

  // UI Preferences (localStorage + backend sync)
  preferences: UserPreferences
}

interface UserProfile {
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

interface UserPreferences {
  locale: string        // 'en' | 'vi'
  darkMode: string      // 'light' | 'dark'
  accentColor: string   // 'green' | 'blue' | 'purple' | 'orange'
  dateFormat: string    // 'DD/MM/YYYY HH:mm:ss'
}
```

### Getters

| Getter | Returns |
|--------|---------|
| `isAuthenticated` | `!!accessToken` |
| `displayName` | `profile?.usrNm` |
| `userRole` | `profile?.roleNm` |

### Actions

| Action | Description |
|--------|-------------|
| `login(username, password)` | POST `/api/auth/login` -> store tokens -> `fetchProfile()` |
| `fetchProfile()` | GET `/api/auth/me` -> populate profile + map backend prefs to local |
| `refreshTokens()` | Read refresh token from localStorage -> POST `/api/auth/refresh-token` -> update tokens |
| `logout()` | POST `/api/auth/logout` -> clear all state + localStorage |
| `updatePreference(key, value)` | Update localStorage immediately, debounced sync to backend (500ms) |
| `restoreSession()` | On app init: refresh token exists? -> `refreshTokens()` -> `fetchProfile()`. Fails? -> redirect to login |

### Auto-Refresh

A `setTimeout` scheduled on `accessExpireIn - 30_000ms` calls `refreshTokens()` before expiry. Timer is cancelled on logout and reset on each token refresh.

## Backend Integration

### API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Authenticate, receive tokens |
| `/api/auth/refresh-token` | POST | Refresh expired access token |
| `/api/auth/logout` | POST | Server-side logout |
| `/api/auth/me` | GET | Fetch user profile + preferences |

### Preference Field Mapping

| Backend field | Frontend preference | Notes |
|---------------|-------------------|-------|
| `langVal` | `locale` | Direct: `'en'` / `'vi'` |
| `sysModVal` | `darkMode` | Direct: `'light'` / `'dark'` |
| `sysColrVal` | `accentColor` | Hex-to-name mapping (see below) |
| `dtFmtVal` | `dateFormat` | Direct string |

### Color Mapping

```typescript
const COLOR_MAP: Record<string, string> = {
  '#52c41a': 'green',
  '#1890ff': 'blue',
  '#722ed1': 'purple',
  '#fa8c16': 'orange',
}

const COLOR_TO_HEX: Record<string, string> = {
  green: '#52c41a',
  blue: '#1890ff',
  purple: '#722ed1',
  orange: '#fa8c16',
}
```

### Sync Behavior

- **On login/restore:** Backend wins. Map backend user fields to frontend preferences, update localStorage.
- **On preference change:** LocalStorage updates immediately. Backend update is debounced (500ms).
- **Missing endpoint:** Backend currently lacks a PATCH endpoint for user preferences. The frontend will implement the sync call; it can be wired once `PATCH /api/auth/preferences` (or equivalent) is available. Until then, preferences are localStorage-only after login.

## Project Structure

### New Files

```
app/
├── stores/
│   ├── index.ts                 # Re-exports all stores
│   └── user.ts                  # Unified user store
├── composables/
│   ├── index.ts                 # Re-exports all composables
│   └── useApi.ts                # Fetch wrapper with auth + 401 retry
├── types/
│   ├── index.ts                 # Re-exports all types
│   └── user.ts                  # UserProfile, UserPreferences, LoginResponse, etc.
├── utils/
│   ├── index.ts                 # Re-exports all utils
│   └── storage.ts               # Typed localStorage helpers with 'app_' prefix
├── plugins/
│   └── auth.client.ts           # Runs restoreSession() on app init
├── middleware/
│   └── auth.global.ts           # Route guard: unauthenticated -> /login
```

### Aliases (nuxt.config.ts)

```typescript
alias: {
  '@stores': resolve(__dirname, 'app/stores'),
  '@composables': resolve(__dirname, 'app/composables'),
  '@types': resolve(__dirname, 'app/types'),
  '@utils': resolve(__dirname, 'app/utils'),
}
```

### Existing Files Modified

| File | Change |
|------|--------|
| `stores/theme.ts` | **Remove** — absorbed into user store preferences |
| `plugins/theme.client.ts` | **Modify** — read accent color + dark mode from user store |
| `components/header/ThemeToggle.vue` | **Modify** — call `userStore.updatePreference('darkMode', ...)` |
| `components/header/LanguageSwitcher.vue` | **Modify** — call `userStore.updatePreference('locale', ...)` |
| `pages/login.vue` | **Modify** — wire form to `userStore.login()` |
| `layouts/default.vue` | **Modify** — use `userStore.profile` for user info display |

### Index File Pattern

Each `index.ts` barrel-exports everything from its directory:

```typescript
// stores/index.ts
export { useUserStore } from './user'

// composables/index.ts
export { useApi } from './useApi'

// types/index.ts
export type { UserProfile, UserPreferences, LoginResponse } from './user'

// utils/index.ts
export { storage } from './storage'
```

## Lifecycle Flows

### App Init (auth.client.ts plugin)

```
1. Check localStorage for refresh token
2. If found:
   a. Load cached profile + preferences from localStorage (instant UI)
   b. refreshTokens() -> on success -> fetchProfile() (fresh data)
   c. On failure -> clear everything -> redirect to /login
3. If not found:
   a. Load default preferences from localStorage (guest)
   b. Stay on current page (middleware handles redirect)
```

### Login

```
1. POST /api/auth/login with credentials
2. Store accessToken in Pinia memory
3. Store refreshToken in localStorage
4. Schedule auto-refresh timer
5. fetchProfile() -> populate profile + preferences
6. Map backend prefs -> localStorage + apply to UI
7. Navigate to dashboard
```

### Preference Change

```
1. Update Pinia state
2. Write to localStorage immediately
3. Apply to UI (colorMode, i18n, PrimeVue theme)
4. Debounced (500ms) PATCH to backend (when endpoint available)
```

### Logout

```
1. POST /api/auth/logout
2. Cancel auto-refresh timer
3. Clear Pinia state
4. Remove tokens + profile + preferences from localStorage
5. Redirect to /login
```

## useApi Composable

Wraps Nuxt `$fetch` with:

- Automatic `Authorization: Bearer <accessToken>` header injection
- 401 response interception: attempt `refreshTokens()` then retry original request once
- If refresh also fails: `logout()` and redirect to `/login`
- Base URL from runtime config (`NUXT_PUBLIC_API_BASE`)

## Default Preferences

When no user is logged in or no localStorage data exists:

```typescript
const DEFAULT_PREFERENCES: UserPreferences = {
  locale: 'en',
  darkMode: 'light',
  accentColor: 'green',
  dateFormat: 'DD/MM/YYYY HH:mm:ss',
}
```
