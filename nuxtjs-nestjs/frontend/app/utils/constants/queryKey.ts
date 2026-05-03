// ── API Endpoints (URLs) ──
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh-token',
    PROFILE: '/api/auth/me',
    PREFERENCES: '/api/auth/preferences'
  },
  ADMINISTRATION: {
    USERS: {
      LIST: '/api/adm/user/getListUserInfo',
      SAVE: '/api/adm/user/saveUsers'
    }
  }
} as const

// ── TanStack Query Keys (cache keys) ──
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const
  },
  administration: {
    users: {
      all: ['administration', 'users'] as const,
      list: (params?: Record<string, any>) =>
        [...queryKeys.administration.users.all, 'list', params] as const
    }
  }
} as const