import type { ProcFlag, ValidationError } from '~/types/table'

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

  function validate(): ValidationError[] {
    return tableRef.value?.validate() ?? []
  }

  function getErrors(): ValidationError[] {
    return tableRef.value?.getErrors() ?? []
  }

  function getCellErrors(row: any, field: string): string[] {
    return tableRef.value?.getCellErrors(row, field) ?? []
  }

  function clearErrors(rowKey?: string | number): void {
    tableRef.value?.clearErrors(rowKey)
  }

  const isValid = computed(() => tableRef.value?.isValid ?? true)

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
    validate,
    getErrors,
    getCellErrors,
    clearErrors,
    isValid,
  }
}
