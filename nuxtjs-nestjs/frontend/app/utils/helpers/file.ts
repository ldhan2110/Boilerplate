const KB = 1024
const MB = 1024 ** 2
const GB = 1024 ** 3

const UNITS: Record<string, number> = { kb: KB, mb: MB, gb: GB }

export function parseFileSize(size: string | number): number {
  if (typeof size === 'number') return size
  const match = size.toLowerCase().trim().match(/^(\d+(?:\.\d+)?)\s*(kb|mb|gb)$/)
  if (!match || !match[1] || !match[2]) return Number(size)
  return parseFloat(match[1]) * UNITS[match[2]]!
}

export function formatFileSize(bytes: number): string {
  if (bytes >= GB) return `${(bytes / GB).toFixed(1)} GB`
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`
  if (bytes >= KB) return `${(bytes / KB).toFixed(1)} KB`
  return `${bytes} B`
}
