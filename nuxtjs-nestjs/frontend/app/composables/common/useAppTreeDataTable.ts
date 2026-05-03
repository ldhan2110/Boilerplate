import type { ExportFormat, ExportScope } from '~/types/table'
import type { AppTreeDataTableExposed } from '~/types/tree-table'

export function useAppTreeDataTable() {
  const tableRef = ref<AppTreeDataTableExposed>()

  function expandAll(): void {
    tableRef.value?.expandAll()
  }

  function collapseAll(): void {
    tableRef.value?.collapseAll()
  }

  function clearSelection(): void {
    tableRef.value?.clearSelection()
  }

  function getSelectedRows(): any[] {
    return tableRef.value?.getSelectedRows() ?? []
  }

  function hasSelectedRow(): boolean {
    return tableRef.value?.hasSelectedRow() ?? false
  }

  function resetTable(): void {
    tableRef.value?.resetTable()
  }

  function exportTable(format: ExportFormat, scope: ExportScope): Promise<void> {
    return tableRef.value?.exportTable(format, scope) ?? Promise.resolve()
  }

  function refresh(): void {
    tableRef.value?.refresh()
  }

  return {
    tableRef,
    expandAll,
    collapseAll,
    clearSelection,
    getSelectedRows,
    hasSelectedRow,
    resetTable,
    exportTable,
    refresh,
  }
}
