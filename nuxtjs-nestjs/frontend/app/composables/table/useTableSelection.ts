import type { SelectionMode } from '~/types/table'

export interface UseTableSelectionOptions {
  selectable: Ref<boolean | undefined>
  selectionMode: Ref<SelectionMode | undefined>
  emit: (selected: any[]) => void
}

export interface UseTableSelectionReturn {
  selectedRows: Ref<any[]>
  clearSelection: () => void
  hasSelection: Ref<boolean>
}

export function useTableSelection(options: UseTableSelectionOptions): UseTableSelectionReturn {
  const { selectable, emit } = options

  const selectedRows = ref<any[]>([])

  const hasSelection = computed(() => selectedRows.value.length > 0)

  // When the parent binds v-model:selection="selectedRows", PrimeVue 4 mutates
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
    clearSelection,
    hasSelection,
  }
}
