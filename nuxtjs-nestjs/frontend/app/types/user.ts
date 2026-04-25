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
