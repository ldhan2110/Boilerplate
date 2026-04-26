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
  onColumnResizeEnd: (dataTableInstance: any) => void
}

export function useTableColumns(options: UseTableColumnsOptions): UseTableColumnsReturn {
  const {
    columns,
    frozenColumns,
    maxFrozenColumns = ref(3),
    defaultColumnWidth = ref(150),
  } = options

  const initialSnapshot = columns.value.map(col => ({ ...col }))
  const columnState = shallowReactive<ColumnDef[]>(
    columns.value.map(col => ({ ...col }))
  )

  for (const col of columnState) {
    if (!col.width) col.width = defaultColumnWidth.value
  }

  const frozenFields = ref(new Set<string>(frozenColumns?.value ?? []))

  function syncFrozenToState() {
    for (let i = 0; i < columnState.length; i++) {
      const shouldBeFrozen = frozenFields.value.has(columnState[i].field)
      if (columnState[i].frozen !== shouldBeFrozen) {
        columnState[i] = { ...columnState[i], frozen: shouldBeFrozen }
      }
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
    const idx = columnState.findIndex(c => c.field === field)
    if (idx !== -1) {
      columnState[idx] = { ...columnState[idx], hidden: !columnState[idx].hidden }
    }
  }

  function showAllColumns() {
    for (let i = 0; i < columnState.length; i++) {
      if (columnState[i].hidden) {
        columnState[i] = { ...columnState[i], hidden: false }
      }
    }
  }

  function freezeColumn(field: string) {
    if (frozenFields.value.size >= maxFrozenColumns.value) return
    frozenFields.value.add(field)
    syncFrozenToState()
  }

  function unfreezeColumn(field: string) {
    frozenFields.value.delete(field)
    syncFrozenToState()
  }

  function isColumnFrozen(field: string): boolean {
    return frozenFields.value.has(field)
  }

  function onColumnResizeEnd(dataTableInstance: any) {
    const el = dataTableInstance.$el as HTMLElement
    const table = dataTableInstance.$refs.table as HTMLElement | undefined
    if (!el || !table) return

    // Read actual widths from all th elements (includes checkbox column)
    const ths = Array.from(
      table.querySelectorAll<HTMLElement>('thead[data-pc-section="thead"] > tr > th')
    )
    if (!ths.length) return

    const widths = ths.map(th => th.getBoundingClientRect().width)
    const totalWidth = widths.reduce((sum, w) => sum + w, 0)

    // Find container width
    const container = el.querySelector<HTMLElement>('[data-pc-section="tablecontainer"]')
    if (!container) return
    const containerWidth = container.clientWidth

    // Only redistribute when columns don't fill the container
    if (totalWidth >= containerWidth) return

    const gap = containerWidth - totalWidth
    const newWidths = widths.map(w => Math.round(w + gap * (w / totalWidth)))

    // Overwrite PrimeVue's style element with redistributed widths
    const attrSelector = dataTableInstance.$attrSelector
    const vScrollPart = dataTableInstance.virtualScrollerDisabled
      ? ''
      : '> [data-pc-name="virtualscroller"]'
    const selector = `[data-pc-name="datatable"][${attrSelector}] > [data-pc-section="tablecontainer"] ${vScrollPart} > table[data-pc-section="table"]`

    let innerHTML = ''
    newWidths.forEach((w, i) => {
      innerHTML += `
        ${selector} > thead[data-pc-section="thead"] > tr > th:nth-child(${i + 1}),
        ${selector} > tbody[data-pc-section="tbody"] > tr > td:nth-child(${i + 1}),
        ${selector} > tfoot[data-pc-section="tfoot"] > tr > td:nth-child(${i + 1}) {
          width: ${w}px !important; max-width: ${w}px !important;
        }
      `
    })

    if (dataTableInstance.styleElement) {
      dataTableInstance.styleElement.innerHTML = innerHTML
    }

    // Update table width to fill container
    table.style.width = table.style.minWidth = containerWidth + 'px'

    // Sync widths back to columnState (skip checkbox column)
    const hasCheckbox = ths[0]?.hasAttribute('data-p-selection-column')
    const offset = hasCheckbox ? 1 : 0
    const cols = visibleColumns.value
    for (let i = 0; i < cols.length; i++) {
      const idx = columnState.indexOf(cols[i])
      if (idx !== -1) {
        columnState[idx] = { ...columnState[idx], width: newWidths[i + offset] }
      }
    }
  }

  function resetColumns() {
    const restored = initialSnapshot.map(col => ({ ...col }))
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
    onColumnResizeEnd,
  }
}
