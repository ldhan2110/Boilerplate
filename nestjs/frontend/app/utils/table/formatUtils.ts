import type { ExcelProps } from '~/types/table'

const CELL_TYPE_MAP: Record<string, string> = {
  number: 'n',
  string: 's',
  date: 'd',
  boolean: 'b',
}

export const DEFAULT_FORMATS: Record<string, string> = {
  number: '#,##0.00',
  date: 'yyyy-mm-dd',
  string: '@',
}

export function toSheetJSCellType(type: ExcelProps['type']): string {
  return CELL_TYPE_MAP[type ?? 'string'] ?? 's'
}

export function applyExcelFormat(cell: any, excelProps?: ExcelProps): void {
  if (!excelProps) return
  if (excelProps.type) {
    cell.t = toSheetJSCellType(excelProps.type)
  }
  if (excelProps.format) {
    cell.z = excelProps.format
  } else if (excelProps.type && DEFAULT_FORMATS[excelProps.type]) {
    cell.z = DEFAULT_FORMATS[excelProps.type]
  }
}
