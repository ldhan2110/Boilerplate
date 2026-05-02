import type { SelectionMode } from '~/types/table'

export interface UseTreeTableSelectionOptions {
  selectable: Ref<boolean | undefined>
  selectionMode: Ref<SelectionMode | undefined>
  rowKey: string
  rows: Ref<any[]>
  emit: (selected: any[]) => void
}

export interface UseTreeTableSelectionReturn {
  selectedRows: Ref<any[]>
  selectionKeys: WritableComputedRef<Record<string, boolean> | undefined>
  clearSelection: () => void
  hasSelection: Ref<boolean>
}

export function useTreeTableSelection(options: UseTreeTableSelectionOptions): UseTreeTableSelectionReturn {
  const { selectable, rowKey, rows, emit } = options

  const selectedRows = ref<any[]>([])

  const hasSelection = computed(() => selectedRows.value.length > 0)

  // PrimeVue TreeTable uses selectionKeys (Record<string, boolean>) instead of
  // a rows array. This computed bridges the two representations.
  const selectionKeys = computed<Record<string, boolean> | undefined>({
    get() {
      if (selectedRows.value.length === 0) return undefined
      const keys: Record<string, boolean> = {}
      for (const row of selectedRows.value) {
        const key = row[rowKey]
        if (key !== undefined) {
          keys[String(key)] = true
        }
      }
      return keys
    },
    set(newKeys) {
      if (!newKeys) {
        selectedRows.value = []
        return
      }
      const keySet = new Set(Object.keys(newKeys))
      selectedRows.value = rows.value.filter(
        (row: any) => keySet.has(String(row[rowKey])),
      )
    },
  })

  // When the parent binds v-model:selectionKeys, PrimeVue 4 mutates
  // the ref directly. Watch it so the parent is notified of every change.
  watch(
    selectedRows,
    (value) => {
      if (!selectable.value) return
      emit(value)
    },
    { deep: true },
  )

  function clearSelection() {
    selectedRows.value = []
    emit([])
  }

  return {
    selectedRows,
    selectionKeys,
    clearSelection,
    hasSelection,
  }
}
