import type { ProcFlag, ProcRow } from '~/types/table'

export function useAppDataTable<T = any>() {
  const tableRef = ref<any>()

  function insertRow(defaultValues?: Partial<T>): T {
    return tableRef.value?.insertRow(defaultValues)
  }

  function insertRows(rowDefaults: Partial<T>[]): T[] {
    return tableRef.value?.insertRows(rowDefaults) ?? []
  }

  function deleteRow(key: string | number): void {
    tableRef.value?.deleteRow(key)
  }

  function deleteRows(keys: (string | number)[]): void {
    tableRef.value?.deleteRows(keys)
  }

  function getRow(key: string | number): ProcRow<T> | undefined {
    return tableRef.value?.getRow(key)
  }

  function getRows(flags?: ProcFlag[]): ProcRow<T>[] {
    return tableRef.value?.getRows(flags) ?? []
  }

  function hasChanges(): boolean {
    return tableRef.value?.hasChanges() ?? false
  }

  function clearChanges(): void {
    tableRef.value?.clearChanges()
  }

  return {
    tableRef,
    insertRow,
    insertRows,
    deleteRow,
    deleteRows,
    getRow,
    getRows,
    hasChanges,
    clearChanges,
  }
}
