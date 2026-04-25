export interface AppMenuItem {
  id: string
  label: string
  icon?: string
  to?: string
  children?: AppMenuItem[]
}
