import type { ColumnDef } from '~/types/table'

export interface UseTableColumnsOptions {
  columns: Ref<ColumnDef[]>
  frozenColumns?: Ref<string[] | undefined>
  maxFrozenColumns?: Ref<number>
  defaultColumnWidth?: Ref<number>
}

export interface UseTableColumnsReturn {
  columnState: ColumnDef[]
  visibleColumns: Ref<ColumnDef[]>
  frozenFields: Ref<Set<string>>
  resetColumns: () => void
  toggleColumnVisibility: (field: string) => void
  showAllColumns: () => void
  freezeColumn: (field: string) => void
  unfreezeColumn: (field: string) => void
  isColumnFrozen: (field: string) => boolean
  canFreezeMore: Ref<boolean>
}

export function useTableColumns(options: UseTableColumnsOptions): UseTableColumnsReturn {
  const {
    columns,
    frozenColumns,
    maxFrozenColumns = ref(3),
    defaultColumnWidth = ref(150),
  } = options

  const initialSnapshot = JSON.parse(JSON.stringify(columns.value)) as ColumnDef[]
  const columnState = shallowReactive<ColumnDef[]>(
    JSON.parse(JSON.stringify(columns.value)) as ColumnDef[]
  )

  for (const col of columnState) {
    if (!col.width) col.width = defaultColumnWidth.value
  }

  const frozenFields = ref(new Set<string>(frozenColumns?.value ?? []))

  function syncFrozenToState() {
    for (const col of columnState) {
      col.frozen = frozenFields.value.has(col.field)
    }
  }
  syncFrozenToState()

  const visibleColumns = computed(() =>
    columnState.filter(col => !col.hidden)
  )

  const canFreezeMore = computed(() =>
    frozenFields.value.size < maxFrozenColumns.value
  )

  function toggleColumnVisibility(field: string) {
    const col = columnState.find(c => c.field === field)
    if (col) {
      col.hidden = !col.hidden
      triggerRef(columnState as any)
    }
  }

  function showAllColumns() {
    for (const col of columnState) {
      col.hidden = false
    }
    triggerRef(columnState as any)
  }

  function freezeColumn(field: string) {
    if (frozenFields.value.size >= maxFrozenColumns.value) return
    frozenFields.value.add(field)
    syncFrozenToState()
    triggerRef(columnState as any)
  }

  function unfreezeColumn(field: string) {
    frozenFields.value.delete(field)
    syncFrozenToState()
    triggerRef(columnState as any)
  }

  function isColumnFrozen(field: string): boolean {
    return frozenFields.value.has(field)
  }

  function resetColumns() {
    const restored = JSON.parse(JSON.stringify(initialSnapshot)) as ColumnDef[]
    columnState.length = 0
    columnState.push(...restored)
    frozenFields.value = new Set(frozenColumns?.value ?? [])
    syncFrozenToState()
  }

  return {
    columnState,
    visibleColumns,
    frozenFields,
    resetColumns,
    toggleColumnVisibility,
    showAllColumns,
    freezeColumn,
    unfreezeColumn,
    isColumnFrozen,
    canFreezeMore,
  }
}
