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
