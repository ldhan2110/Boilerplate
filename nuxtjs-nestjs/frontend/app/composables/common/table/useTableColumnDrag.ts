import type { ColumnDef } from '~/types/table'
import type { HeaderCell } from './useTableSpan'
import type { UseTableColumnsReturn } from './useTableColumns'

export interface UseTableColumnDragOptions {
  columns: Ref<ColumnDef[]>
  hasColumnGroups: ComputedRef<boolean>
  headerRows: ComputedRef<HeaderCell[][]>
  reorderableColumns: Ref<boolean>
  columnsApi: UseTableColumnsReturn
}

export interface UseTableColumnDragReturn {
  getDragAttrs: (cell: HeaderCell, rowIndex: number) => Record<string, any>
  dragOverGroupIndex: Ref<number | null>
  dragDirection: Ref<'left' | 'right' | null>
  isDragging: Ref<boolean>
  /** True when composable is active (grouped + reorderable) */
  isActive: ComputedRef<boolean>
}

interface DragSource {
  topLevelIndex: number
  childIndex: number | null  // null = group header or standalone
  field?: string
}

/**
 * Find which top-level column index owns a given leaf field.
 * Returns { topLevelIndex, childIndex } or null.
 */
function resolveField(columns: ColumnDef[], field: string): { topLevelIndex: number; childIndex: number | null } | null {
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i]!
    if (col.children?.length) {
      const ci = col.children.findIndex(c => c.field === field)
      if (ci !== -1) return { topLevelIndex: i, childIndex: ci }
    } else if (col.field === field) {
      return { topLevelIndex: i, childIndex: null }
    }
  }
  return null
}

/**
 * Find top-level index for a group header cell (no field, matched by header text).
 */
function resolveGroupHeader(columns: ColumnDef[], header: string): number {
  return columns.findIndex(col => col.children?.length && col.header === header)
}

export function useTableColumnDrag(options: UseTableColumnDragOptions): UseTableColumnDragReturn {
  const { columns, hasColumnGroups, reorderableColumns, columnsApi } = options

  const isDragging = ref(false)
  const dragOverGroupIndex = ref<number | null>(null)
  const dragDirection = ref<'left' | 'right' | null>(null)
  const dragSource = ref<DragSource | null>(null)

  const isActive = computed(() => hasColumnGroups.value && reorderableColumns.value)

  function resolveCellToSource(cell: HeaderCell): DragSource | null {
    const cols = columns.value
    if (cell.field) {
      // Leaf cell -- resolve via field
      const resolved = resolveField(cols, cell.field)
      if (!resolved) return null
      return { ...resolved, field: cell.field }
    }
    // Group header cell
    const idx = resolveGroupHeader(cols, cell.header)
    if (idx === -1) return null
    return { topLevelIndex: idx, childIndex: null }
  }

  function isFrozen(cell: HeaderCell): boolean {
    if (cell.col?.frozen) return true
    // Check if the top-level column containing this cell is frozen
    const source = resolveCellToSource(cell)
    if (!source) return false
    const topCol = columns.value[source.topLevelIndex]
    if (topCol?.frozen) return true
    // Check if all children are frozen
    if (topCol?.children?.length) {
      return topCol.children.every(c => c.frozen)
    }
    return false
  }

  function onDragStart(e: DragEvent, cell: HeaderCell) {
    const source = resolveCellToSource(cell)
    if (!source) {
      e.preventDefault()
      return
    }
    dragSource.value = source
    isDragging.value = true

    // Set drag data
    e.dataTransfer!.effectAllowed = 'move'
    e.dataTransfer!.setData('text/plain', JSON.stringify(source))

    // Add visual class to the dragged header div
    const el = (e.target as HTMLElement).closest('.grouped-header-cell') || (e.target as HTMLElement)
    el.classList.add('column-drag-source')
  }

  function onDragOver(e: DragEvent, cell: HeaderCell) {
    if (!dragSource.value) return
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'

    const target = resolveCellToSource(cell)
    if (!target) return

    dragOverGroupIndex.value = target.topLevelIndex

    // Determine direction
    if (dragSource.value.topLevelIndex < target.topLevelIndex) {
      dragDirection.value = 'right'
    } else if (dragSource.value.topLevelIndex > target.topLevelIndex) {
      dragDirection.value = 'left'
    } else {
      // Same group -- inner reorder direction
      if (dragSource.value.childIndex !== null && target.childIndex !== null) {
        dragDirection.value = dragSource.value.childIndex < target.childIndex ? 'right' : 'left'
      } else {
        dragDirection.value = null
      }
    }
  }

  function onDragLeave(e: DragEvent) {
    // Only clear if leaving the header div entirely
    const relatedTarget = e.relatedTarget as HTMLElement | null
    const el = (e.target as HTMLElement).closest('.grouped-header-cell') || (e.target as HTMLElement)
    if (el && relatedTarget && el.contains(relatedTarget)) return
    dragOverGroupIndex.value = null
    dragDirection.value = null
  }

  function onDrop(e: DragEvent, cell: HeaderCell) {
    e.preventDefault()
    if (!dragSource.value) return

    const source = dragSource.value
    const target = resolveCellToSource(cell)
    if (!target) { cleanup(e); return }

    if (source.topLevelIndex === target.topLevelIndex) {
      // Same group -- inner reorder
      if (source.childIndex !== null && target.childIndex !== null && source.childIndex !== target.childIndex) {
        columnsApi.reorderChildren(source.topLevelIndex, source.childIndex, target.childIndex)
      }
    } else {
      // Different group -- swap top-level
      columnsApi.reorderTopLevel(source.topLevelIndex, target.topLevelIndex)
    }

    cleanup(e)
  }

  function onDragEnd(e: DragEvent) {
    cleanup(e)
  }

  function cleanup(e?: DragEvent) {
    isDragging.value = false
    dragSource.value = null
    dragOverGroupIndex.value = null
    dragDirection.value = null

    // Remove all drag classes
    if (e) {
      const table = (e.target as HTMLElement).closest('.app-data-table')
      if (table) {
        table.querySelectorAll('.column-drag-source').forEach(el => el.classList.remove('column-drag-source'))
      }
    }
  }

  function getDragAttrs(cell: HeaderCell, _rowIndex: number): Record<string, any> {
    if (!isActive.value) return {}
    if (isFrozen(cell)) return {}

    return {
      draggable: true,
      onDragstart: (e: DragEvent) => onDragStart(e, cell),
      onDragover: (e: DragEvent) => onDragOver(e, cell),
      onDragleave: (e: DragEvent) => onDragLeave(e),
      onDrop: (e: DragEvent) => onDrop(e, cell),
      onDragend: (e: DragEvent) => onDragEnd(e),
    }
  }

  return {
    getDragAttrs,
    dragOverGroupIndex,
    dragDirection,
    isDragging,
    isActive,
  }
}
