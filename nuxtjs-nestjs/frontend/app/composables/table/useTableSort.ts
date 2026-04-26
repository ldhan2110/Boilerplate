import type { BackendMode, SortEvent } from '~/types/table'

export interface UseTableSortOptions {
  sortBackend: Ref<BackendMode>
  defaultSortField?: Ref<string | undefined>
  defaultSortOrder?: Ref<1 | -1 | undefined>
  emit: (event: 'sort', payload: SortEvent) => void
}

export interface UseTableSortReturn {
  sortField: Ref<string | undefined>
  sortOrder: Ref<1 | -1>
  multiSortMeta: Ref<Array<{ field: string; order: 1 | -1 }>>
  sortChips: Ref<Array<{ field: string; order: 1 | -1; label: string }>>
  onSort: (event: any) => void
  setSortAsc: (field: string) => void
  setSortDesc: (field: string) => void
  clearSort: () => void
  isFieldSorted: (field: string) => boolean
}

export function useTableSort(options: UseTableSortOptions): UseTableSortReturn {
  const { sortBackend, defaultSortField, defaultSortOrder, emit } = options

  const sortField = ref<string | undefined>(defaultSortField?.value)
  const sortOrder = ref<1 | -1>(defaultSortOrder?.value ?? 1)
  const multiSortMeta = ref<Array<{ field: string; order: 1 | -1 }>>(
    defaultSortField?.value
      ? [{ field: defaultSortField.value, order: defaultSortOrder?.value ?? 1 }]
      : []
  )

  const sortChips = computed(() =>
    multiSortMeta.value.map(m => ({
      field: m.field,
      order: m.order,
      label: `${m.field} ${m.order === 1 ? '↑' : '↓'}`,
    }))
  )

  function emitSort() {
    if (sortBackend.value !== 'server') return
    emit('sort', {
      field: sortField.value ?? '',
      order: sortOrder.value,
      multiSortMeta: multiSortMeta.value,
    })
  }

  function onSort(event: any) {
    multiSortMeta.value = event.multiSortMeta ?? []
    if (multiSortMeta.value.length > 0) {
      sortField.value = multiSortMeta.value[0].field
      sortOrder.value = multiSortMeta.value[0].order
    }
    emitSort()
  }

  function setSortAsc(field: string) {
    multiSortMeta.value = [{ field, order: 1 }]
    sortField.value = field
    sortOrder.value = 1
    emitSort()
  }

  function setSortDesc(field: string) {
    multiSortMeta.value = [{ field, order: -1 }]
    sortField.value = field
    sortOrder.value = -1
    emitSort()
  }

  function clearSort() {
    sortField.value = undefined
    sortOrder.value = 1
    multiSortMeta.value = []
    emitSort()
  }

  function isFieldSorted(field: string): boolean {
    return multiSortMeta.value.some(m => m.field === field)
  }

  return {
    sortField,
    sortOrder,
    multiSortMeta,
    sortChips,
    onSort,
    setSortAsc,
    setSortDesc,
    clearSort,
    isFieldSorted,
  }
}
