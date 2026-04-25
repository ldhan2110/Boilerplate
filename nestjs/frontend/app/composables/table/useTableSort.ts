import type { SortMode, BackendMode, SortEvent } from '~/types/table'

export interface UseTableSortOptions {
  sortMode: Ref<SortMode>
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
  addToSort: (field: string) => void
  removeFromSort: (field: string) => void
  clearSort: () => void
  isFieldSorted: (field: string) => boolean
}

export function useTableSort(options: UseTableSortOptions): UseTableSortReturn {
  const { sortMode, sortBackend, defaultSortField, defaultSortOrder, emit } = options

  const sortField = ref<string | undefined>(defaultSortField?.value)
  const sortOrder = ref<1 | -1>(defaultSortOrder?.value ?? 1)
  const multiSortMeta = ref<Array<{ field: string; order: 1 | -1 }>>(
    defaultSortField?.value
      ? [{ field: defaultSortField.value, order: defaultSortOrder?.value ?? 1 }]
      : []
  )

  const sortChips = computed(() => {
    if (sortMode.value === 'multiple') {
      return multiSortMeta.value.map(m => ({
        field: m.field,
        order: m.order,
        label: `${m.field} ${m.order === 1 ? '↑' : '↓'}`,
      }))
    }
    if (sortField.value) {
      return [{
        field: sortField.value,
        order: sortOrder.value,
        label: `${sortField.value} ${sortOrder.value === 1 ? '↑' : '↓'}`,
      }]
    }
    return []
  })

  function emitSort() {
    if (sortBackend.value !== 'server') return
    emit('sort', {
      field: sortField.value ?? '',
      order: sortOrder.value,
      multiSortMeta: sortMode.value === 'multiple' ? multiSortMeta.value : undefined,
    })
  }

  function onSort(event: any) {
    if (sortMode.value === 'multiple') {
      multiSortMeta.value = event.multiSortMeta ?? []
      if (multiSortMeta.value.length > 0) {
        sortField.value = multiSortMeta.value[0].field
        sortOrder.value = multiSortMeta.value[0].order
      }
    } else {
      sortField.value = event.sortField
      sortOrder.value = event.sortOrder
    }
    emitSort()
  }

  function setSortAsc(field: string) {
    if (sortMode.value === 'multiple') {
      multiSortMeta.value = [{ field, order: 1 }]
    }
    sortField.value = field
    sortOrder.value = 1
    emitSort()
  }

  function setSortDesc(field: string) {
    if (sortMode.value === 'multiple') {
      multiSortMeta.value = [{ field, order: -1 }]
    }
    sortField.value = field
    sortOrder.value = -1
    emitSort()
  }

  function addToSort(field: string) {
    if (sortMode.value !== 'multiple') return
    const existing = multiSortMeta.value.find(m => m.field === field)
    if (existing) return
    if (multiSortMeta.value.length >= 5) return
    multiSortMeta.value = [...multiSortMeta.value, { field, order: 1 }]
    emitSort()
  }

  function removeFromSort(field: string) {
    multiSortMeta.value = multiSortMeta.value.filter(m => m.field !== field)
    if (multiSortMeta.value.length > 0) {
      sortField.value = multiSortMeta.value[0].field
      sortOrder.value = multiSortMeta.value[0].order
    } else {
      sortField.value = undefined
      sortOrder.value = 1
    }
    emitSort()
  }

  function clearSort() {
    sortField.value = undefined
    sortOrder.value = 1
    multiSortMeta.value = []
    emitSort()
  }

  function isFieldSorted(field: string): boolean {
    if (sortMode.value === 'multiple') {
      return multiSortMeta.value.some(m => m.field === field)
    }
    return sortField.value === field
  }

  return {
    sortField,
    sortOrder,
    multiSortMeta,
    sortChips,
    onSort,
    setSortAsc,
    setSortDesc,
    addToSort,
    removeFromSort,
    clearSort,
    isFieldSorted,
  }
}
