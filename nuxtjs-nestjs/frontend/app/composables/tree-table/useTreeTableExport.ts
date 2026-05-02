import type { ColumnDef, ExportFormat, ExportScope } from '~/types/table'
import { applyExcelFormat } from '~/utils/table'

export interface UseTreeTableExportOptions {
  rows: Ref<any[]>
  displayedRows: Ref<any[]>
  selectedRows: Ref<any[]>
  visibleColumns: Ref<ColumnDef[]>
  exportFilename: Ref<string>
}

export interface UseTreeTableExportReturn {
  exportTable: (format: ExportFormat, scope: ExportScope) => Promise<void>
}

export function useTreeTableExport(options: UseTreeTableExportOptions): UseTreeTableExportReturn {
  const { rows, displayedRows, selectedRows, visibleColumns, exportFilename } = options

  function getDataByScope(scope: ExportScope): any[] {
    switch (scope) {
      case 'all':
        return rows.value
      case 'visible':
        return displayedRows.value
      case 'selected':
        return selectedRows.value
      default:
        return rows.value
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function exportCsv(data: any[], columns: ColumnDef[]) {
    const headers = columns.map(col => `"${col.header.replace(/"/g, '""')}"`)
    const csvRows = [headers.join(',')]

    for (const row of data) {
      const values = columns.map(col => {
        const val = col.format ? col.format(row[col.field!], row) : row[col.field!]
        if (val === null || val === undefined) return ''
        const str = String(val)
        return `"${str.replace(/"/g, '""')}"`
      })
      csvRows.push(values.join(','))
    }

    const csvContent = csvRows.join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, `${exportFilename.value}.csv`)
  }

  async function exportXlsx(data: any[], columns: ColumnDef[]) {
    const XLSX = await import('xlsx')

    const wsData: any[][] = [columns.map(col => col.header)]

    for (const row of data) {
      const rowData = columns.map(col => {
        const val = row[col.field!]
        if (col.excelProps?.type === 'date' && val) {
          return new Date(val)
        }
        return val
      })
      wsData.push(rowData)
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
    for (let colIdx = 0; colIdx <= range.e.c; colIdx++) {
      const col = columns[colIdx]
      if (!col?.excelProps) continue

      for (let rowIdx = 1; rowIdx <= range.e.r; rowIdx++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx })
        const cell = ws[cellRef]
        if (cell) {
          applyExcelFormat(cell, col.excelProps)
        }
      }
    }

    ws['!cols'] = columns.map(col => ({
      wch: Math.max(col.header.length, 12),
    }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    XLSX.writeFile(wb, `${exportFilename.value}.xlsx`)
  }

  async function exportTable(format: ExportFormat, scope: ExportScope): Promise<void> {
    const columns = visibleColumns.value
    const data = getDataByScope(scope)

    if (data.length === 0) return

    if (format === 'csv') {
      exportCsv(data, columns)
    } else if (format === 'xlsx') {
      await exportXlsx(data, columns)
    }
  }

  return { exportTable }
}
