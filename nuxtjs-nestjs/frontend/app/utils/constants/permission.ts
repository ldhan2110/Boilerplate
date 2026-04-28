export const ABILITY_ACTION = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage'
} as const

export const ABILITY_SUBJECT = {
  USER: 'User',
  ROLE: 'Role',
  PROGRAM: 'Program',
  SETTING: 'Setting',
  ALL: 'all'
} as const

export type AbilityAction = typeof ABILITY_ACTION[keyof typeof ABILITY_ACTION]
export type AbilitySubject = typeof ABILITY_SUBJECT[keyof typeof ABILITY_SUBJECT] | 'all'

export type AbilityTuple = [AbilityAction, AbilitySubject]

export const ROLE_PERMISSIONS: Record<string, AbilityTuple[]> = {
  admin: [
    ['manage', 'all']
  ],
  user: [
    ['read', 'User'],
    ['read', 'Program'],
    ['read', 'Setting']
  ]
}
