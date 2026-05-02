const UNITS: Record<string, number> = {
  kb: 1024,
  mb: 1024 ** 2,
  gb: 1024 ** 3,
}

export function parseFileSize(size: string | number): number {
  if (typeof size === 'number') return size
  const match = size.toLowerCase().trim().match(/^(\d+(?:\.\d+)?)\s*(kb|mb|gb)$/)
  if (!match) return Number(size)
  return parseFloat(match[1]) * UNITS[match[2]]
}

export function formatFileSize(bytes: number): string {
  if (bytes >= UNITS.gb) return `${(bytes / UNITS.gb).toFixed(1)} GB`
  if (bytes >= UNITS.mb) return `${(bytes / UNITS.mb).toFixed(1)} MB`
  if (bytes >= UNITS.kb) return `${(bytes / UNITS.kb).toFixed(1)} KB`
  return `${bytes} B`
}
