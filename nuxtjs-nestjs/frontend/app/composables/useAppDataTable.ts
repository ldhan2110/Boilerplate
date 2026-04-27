import type { ProcFlag } from '~/types/table'

export function useAppDataTable<T = any>() {
  const tableRef = ref<any>()

  function insertRow(defaultValues?: Partial<T>): T & { procFlag: ProcFlag } {
    return tableRef.value?.insertRow(defaultValues)
  }

  function insertRows(rowDefaults: Partial<T>[]): (T & { procFlag: ProcFlag })[] {
    return tableRef.value?.insertRows(rowDefaults) ?? []
  }

  function deleteRow(key: string | number): void {
    tableRef.value?.deleteRow(key)
  }

  function deleteRows(keys: (string | number)[]): void {
    tableRef.value?.deleteRows(keys)
  }

  function getRow(key: string | number): (T & { procFlag: ProcFlag }) | undefined {
    return tableRef.value?.getRow(key)
  }

  function getRows(flags?: ProcFlag[]): (T & { procFlag: ProcFlag })[] {
    return tableRef.value?.getRows(flags) ?? []
  }

  function hasChanges(): boolean {
    return tableRef.value?.hasChanges() ?? false
  }

  function clearChanges(): void {
    tableRef.value?.clearChanges()
  }

  function clearSelection(): void {
    tableRef.value?.clearSelection()
  }

  function deleteSelected(): void {
    tableRef.value?.deleteSelected()
  }

  return {
    tableRef,
    insertRow,
    insertRows,
    deleteRow,
    deleteRows,
    deleteSelected,
    getRow,
    getRows,
    hasChanges,
    clearChanges,
    clearSelection,
  }
}
