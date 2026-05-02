import type { ColumnDef } from '~/types/table'
import type { HeaderCell } from '~/composables/table/useTableSpan'

export interface UseTreeTableColumnsOptions {
  columns: Ref<ColumnDef[]>
  frozenColumns?: Ref<string[] | undefined>
  maxFrozenColumns?: Ref<number>
  defaultColumnWidth?: Ref<number>
}

export interface UseTreeTableColumnsReturn {
  columnState: ColumnDef[]
  visibleColumns: Ref<ColumnDef[]>
  leafColumns: ComputedRef<ColumnDef[]>
  hasColumnGroups: ComputedRef<boolean>
  headerRows: ComputedRef<HeaderCell[][]>
  frozenFields: Ref<Set<string>>
  resetColumns: () => void
  toggleColumnVisibility: (field: string) => void
  showAllColumns: () => void
  freezeColumn: (field: string) => void
  unfreezeColumn: (field: string) => void
  isColumnFrozen: (field: string) => boolean
  canFreezeMore: Ref<boolean>
  onColumnResizeEnd: (dataTableInstance: any) => void
  moveColumnUp: (field: string) => void
  moveColumnDown: (field: string) => void
  reorderTopLevel: (fromIndex: number, toIndex: number) => void
  reorderChildren: (parentIndex: number, fromChildIndex: number, toChildIndex: number) => void
}

/** Count leaf nodes under a column (recursively). */
function countLeaves(col: ColumnDef): number {
  if (!col.children?.length) return 1
  return col.children.reduce((sum, child) => sum + countLeaves(child), 0)
}

/** Find max depth of the column tree. */
function getMaxDepth(columns: ColumnDef[]): number {
  let max = 1
  for (const col of columns) {
    if (col.children?.length) {
      const childDepth = 1 + getMaxDepth(col.children)
      if (childDepth > max) max = childDepth
    }
  }
  return max
}

/** Flatten column tree to leaf columns in left-to-right order. */
function flattenLeaves(columns: ColumnDef[]): ColumnDef[] {
  const leaves: ColumnDef[] = []
  for (const col of columns) {
    if (col.children?.length) {
      leaves.push(...flattenLeaves(col.children))
    } else if (col.field) {
      leaves.push(col)
    }
  }
  return leaves
}

/** Build header rows from column tree for colspan rendering. */
function buildHeaderRows(columns: ColumnDef[], maxDepth: number): HeaderCell[][] {
  const rows: HeaderCell[][] = Array.from({ length: maxDepth }, () => [])

  function walk(cols: ColumnDef[], depth: number) {
    for (const col of cols) {
      if (col.children?.length) {
        rows[depth]!.push({
          header: col.header,
          colspan: countLeaves(col),
          rowspan: 1,
          col,
        })
        walk(col.children, depth + 1)
      } else {
        rows[depth]!.push({
          header: col.header,
          colspan: 1,
          rowspan: maxDepth - depth,
          col,
          field: col.field,
        })
      }
    }
  }

  walk(columns, 0)
  return rows
}

export function useTreeTableColumns(options: UseTreeTableColumnsOptions): UseTreeTableColumnsReturn {
  const {
    columns,
    frozenColumns,
    maxFrozenColumns = ref(3),
    defaultColumnWidth = ref(150)
  } = options

  const cloneColumn = (col: ColumnDef): ColumnDef => ({
    ...col,
    children: col.children?.map(c => cloneColumn(c))
  })

  const initialSnapshot = columns.value.map(cloneColumn)
  const columnState = shallowReactive<ColumnDef[]>(
    columns.value.map(cloneColumn)
  )

  for (const col of columnState) {
    if (!col.width) col.width = defaultColumnWidth.value
  }

  const frozenFields = ref(new Set<string>(frozenColumns?.value ?? []))

  function syncFrozenToState() {
    for (let i = 0; i < columnState.length; i++) {
      const colField = columnState[i]!.field
      if (!colField) continue
      const shouldBeFrozen = frozenFields.value.has(colField)
      if (columnState[i]!.frozen !== shouldBeFrozen) {
        columnState[i] = { ...columnState[i]!, frozen: shouldBeFrozen }
      }
    }
  }
  syncFrozenToState()

  const visibleColumns = computed(() =>
    columnState.filter(col => !col.hidden)
  )

  const hasColumnGroups = computed(() =>
    columnState.some(col => col.children?.length)
  )

  const maxDepth = computed(() => getMaxDepth(columnState))

  const headerRows = computed<HeaderCell[][]>(() => {
    if (!hasColumnGroups.value) return []
    return buildHeaderRows(columnState.filter(col => !col.hidden), maxDepth.value)
  })

  const leafColumns = computed<ColumnDef[]>(() =>
    flattenLeaves(columnState.filter(col => !col.hidden))
  )

  const canFreezeMore = computed(() =>
    frozenFields.value.size < maxFrozenColumns.value
  )

  function toggleColumnVisibility(field: string) {
    // Search top-level
    const idx = columnState.findIndex(c => c.field === field)
    if (idx !== -1) {
      columnState[idx] = { ...columnState[idx]!, hidden: !columnState[idx]!.hidden }
      return
    }
    // Search inside children (grouped columns)
    for (let i = 0; i < columnState.length; i++) {
      const parent = columnState[i]!
      if (!parent.children?.length) continue
      const ci = parent.children.findIndex(c => c.field === field)
      if (ci !== -1) {
        parent.children[ci] = { ...parent.children[ci]!, hidden: !parent.children[ci]!.hidden }
        columnState[i] = { ...parent }
        return
      }
    }
  }

  function showAllColumns() {
    for (let i = 0; i < columnState.length; i++) {
      const col = columnState[i]!
      let changed = col.hidden
      if (changed) col.hidden = false
      if (col.children?.length) {
        for (let j = 0; j < col.children.length; j++) {
          if (col.children[j]!.hidden) {
            col.children[j] = { ...col.children[j]!, hidden: false }
            changed = true
          }
        }
      }
      if (changed) columnState[i] = { ...col }
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

  function onColumnResizeEnd(treeTableInstance: any) {
    const el = treeTableInstance.$el as HTMLElement
    if (!el) return

    // PTreeTable uses a table inside tablecontainer
    const container = el.querySelector<HTMLElement>('[data-pc-section="tablecontainer"]')
    if (!container) return
    const table = container.querySelector<HTMLElement>('table[data-pc-section="table"]')
    if (!table) return

    // Read actual widths from all th elements
    const ths = Array.from(
      table.querySelectorAll<HTMLElement>('thead[data-pc-section="thead"] > tr > th')
    )
    if (!ths.length) return

    const widths = ths.map(th => th.getBoundingClientRect().width)
    const totalWidth = widths.reduce((sum, w) => sum + w, 0)
    const containerWidth = container.clientWidth

    // Only redistribute when columns don't fill the container
    if (totalWidth >= containerWidth) return

    const gap = containerWidth - totalWidth
    const newWidths = widths.map(w => Math.round(w + gap * (w / totalWidth)))

    // Overwrite PrimeVue's style element with redistributed widths
    const attrSelector = treeTableInstance.$attrSelector
    const selector = `[data-pc-name="treetable"][${attrSelector}] > [data-pc-section="tablecontainer"] > table[data-pc-section="table"]`

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

    if (treeTableInstance.styleElement) {
      treeTableInstance.styleElement.innerHTML = innerHTML
    }

    // Update table width to fill container
    table.style.width = table.style.minWidth = containerWidth + 'px'

    // Sync widths back to columnState (skip checkbox column)
    const hasCheckbox = ths[0]?.hasAttribute('data-p-selection-column')
    const offset = hasCheckbox ? 1 : 0
    const cols = visibleColumns.value
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i]!
      const idx = columnState.indexOf(col)
      if (idx !== -1) {
        columnState[idx] = { ...columnState[idx]!, width: newWidths[i + offset] }
      }
    }
  }

  function moveColumnUp(field: string) {
    const idx = columnState.findIndex(c => c.field === field)
    if (idx > 0) {
      const item = columnState.splice(idx, 1)[0]!
      columnState.splice(idx - 1, 0, item)
    }
  }

  function moveColumnDown(field: string) {
    const idx = columnState.findIndex(c => c.field === field)
    if (idx >= 0 && idx < columnState.length - 1) {
      const item = columnState.splice(idx, 1)[0]!
      columnState.splice(idx + 1, 0, item)
    }
  }

  function reorderTopLevel(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return
    if (fromIndex < 0 || toIndex < 0) return
    if (fromIndex >= columnState.length || toIndex >= columnState.length) return

    const item = columnState.splice(fromIndex, 1)[0]!
    columnState.splice(toIndex, 0, item)
  }

  function reorderChildren(parentIndex: number, fromChildIndex: number, toChildIndex: number) {
    if (fromChildIndex === toChildIndex) return
    const parent = columnState[parentIndex]
    if (!parent?.children?.length) return
    if (fromChildIndex < 0 || toChildIndex < 0) return
    if (fromChildIndex >= parent.children.length || toChildIndex >= parent.children.length) return

    const child = parent.children.splice(fromChildIndex, 1)[0]!
    parent.children.splice(toChildIndex, 0, child)
    // Trigger reactivity on the parent slot
    columnState[parentIndex] = { ...parent }
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
    leafColumns,
    hasColumnGroups,
    headerRows,
    frozenFields,
    resetColumns,
    toggleColumnVisibility,
    showAllColumns,
    freezeColumn,
    unfreezeColumn,
    isColumnFrozen,
    canFreezeMore,
    onColumnResizeEnd,
    moveColumnUp,
    moveColumnDown,
    reorderTopLevel,
    reorderChildren
  }
}
