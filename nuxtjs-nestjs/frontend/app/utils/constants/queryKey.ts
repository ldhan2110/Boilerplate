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
    },
    PROGRAMS: {
      LIST: '/api/adm/program/getProgramList',
      GET: '/api/adm/program/getProgram',
      INSERT: '/api/adm/program/insertProgram',
      UPDATE: '/api/adm/program/updateProgram',
      DELETE: '/api/adm/program/deletePrograms',
      GET_PERMISSIONS: '/api/adm/program/getPermissionByProgram',
      SAVE_PERMISSIONS: '/api/adm/program/savePermissionsByProgram',
    },
    ROLES: {
      LIST: '/api/adm/role/getRoleList',
      GET: '/api/adm/role/getRole',
      INSERT: '/api/adm/role/insertRole',
      UPDATE: '/api/adm/role/updateRole',
      DELETE: '/api/adm/role/deleteRoles',
    },
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
    },
    programs: {
      all: ['administration', 'programs'] as const,
      list: (params?: Record<string, any>) =>
        [...queryKeys.administration.programs.all, 'list', params] as const,
      detail: (pgmId?: string) =>
        [...queryKeys.administration.programs.all, 'detail', pgmId] as const,
      permissions: (pgmId?: string) =>
        [...queryKeys.administration.programs.all, 'permissions', pgmId] as const,
    },
    roles: {
      all: ['administration', 'roles'] as const,
      list: (params?: Record<string, any>) =>
        [...queryKeys.administration.roles.all, 'list', params] as const,
      detail: (roleId?: string) =>
        [...queryKeys.administration.roles.all, 'detail', roleId] as const,
    },
  }
} as const