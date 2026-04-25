import type { ColumnDef, EditMode, CellConfig, EditSaveEvent } from '~/types/table'

export interface UseTableEditOptions {
  editable: Ref<boolean | undefined>
  editMode: Ref<EditMode>
  editableColumns: Ref<string[] | undefined>
  columnState: ColumnDef[]
  visibleColumns: Ref<ColumnDef[]>
  rows: Ref<any[]>
  displayedRows: Ref<any[]>
  rowKey: Ref<string>
  cellConfig: Ref<((row: any, field: string) => CellConfig | void) | undefined>
  dataTableRef: Ref<any>
  emit: {
    editSave: (payload: EditSaveEvent) => void
    editCancel: (payload: { row: any }) => void
  }
}

export interface UseTableEditReturn {
  activeCell: Ref<{ rowIndex: number; field: string } | null>
  dirtyRows: Ref<Set<string | number>>
  editingRows: Ref<any[]>
  cellConfigs: Ref<Map<string | number, Record<string, CellConfig>>>
  handleKeyDown: (e: KeyboardEvent) => void
  onCellEditComplete: (event: any) => void
  onRowEditSave: (event: any) => void
  activateCell: (rowIndex: number, field: string) => void
  deactivateCell: () => void
  getDirtyRows: () => any[]
  clearDirty: (rowKey?: string | number) => void
  getEditableGrid: () => string[][]
  isCellEditable: (row: any, field: string) => boolean
  isCellDisabled: (row: any, field: string) => boolean
  getCellOptions: (row: any, col: ColumnDef) => any[] | undefined
  getCellDisplayValue: (val: any, row: any, col: ColumnDef) => string
}

export function useTableEdit(options: UseTableEditOptions): UseTableEditReturn {
  const {
    editable,
    editMode,
    editableColumns,
    columnState,
    visibleColumns,
    rows,
    displayedRows,
    rowKey,
    cellConfig,
    dataTableRef,
    emit,
  } = options

  const activeCell = ref<{ rowIndex: number; field: string } | null>(null)
  const dirtyRows = ref(new Set<string | number>())
  const editingRows = ref<any[]>([])

  const cellConfigs = computed(() => {
    const map = new Map<string | number, Record<string, CellConfig>>()
    if (!cellConfig.value) return map

    for (const row of displayedRows.value) {
      const key = row[rowKey.value]
      const rowConfigs: Record<string, CellConfig> = {}
      for (const col of visibleColumns.value) {
        const result = cellConfig.value(row, col.field)
        if (result) rowConfigs[col.field] = result
      }
      if (Object.keys(rowConfigs).length > 0) {
        map.set(key, rowConfigs)
      }
    }
    return map
  })

  function getCellConfig(row: any, field: string): CellConfig | undefined {
    const key = row[rowKey.value]
    return cellConfigs.value.get(key)?.[field]
  }

  function isCellEditable(row: any, field: string): boolean {
    if (!editable.value) return false
    const config = getCellConfig(row, field)
    if (config?.editable === false) return false
    if (config?.disabled) return false
    if (editableColumns.value && !editableColumns.value.includes(field)) return false
    const col = columnState.find(c => c.field === field)
    if (col?.editable === false) return false
    return true
  }

  function isCellDisabled(row: any, field: string): boolean {
    const config = getCellConfig(row, field)
    return config?.disabled === true
  }

  function getCellOptions(row: any, col: ColumnDef): any[] | undefined {
    const config = getCellConfig(row, col.field)
    return config?.options ?? col.editOptions
  }

  function getCellDisplayValue(val: any, row: any, col: ColumnDef): string {
    const config = getCellConfig(row, col.field)
    if (config?.render) return config.render(val, row)
    if (col.format) return col.format(val, row)
    return val?.toString() ?? ''
  }

  function getEditableGrid(): string[][] {
    const editableCols = visibleColumns.value.filter(col => {
      if (col.editable === false) return false
      if (editableColumns.value && !editableColumns.value.includes(col.field)) return false
      return true
    })
    return displayedRows.value.map(() => editableCols.map(col => col.field))
  }

  function findCellPosition(rowIndex: number, field: string): { row: number; col: number } | null {
    const grid = getEditableGrid()
    if (rowIndex < 0 || rowIndex >= grid.length) return null
    const colIndex = grid[rowIndex]?.indexOf(field) ?? -1
    if (colIndex === -1) return null
    return { row: rowIndex, col: colIndex }
  }

  function move(direction: 'next' | 'prev' | 'up' | 'down' | 'left' | 'right', depth = 0) {
    if (!activeCell.value || depth > 50) return
    const grid = getEditableGrid()
    const pos = findCellPosition(activeCell.value.rowIndex, activeCell.value.field)
    if (!pos) return

    let { row, col } = pos
    const totalRows = grid.length
    const totalCols = grid[0]?.length ?? 0
    if (totalRows === 0 || totalCols === 0) return

    switch (direction) {
      case 'next':
        col++
        if (col >= totalCols) {
          col = 0
          row++
        }
        if (row >= totalRows) return
        break
      case 'prev':
        col--
        if (col < 0) {
          col = totalCols - 1
          row--
        }
        if (row < 0) return
        break
      case 'right':
        col++
        if (col >= totalCols) return
        break
      case 'left':
        col--
        if (col < 0) return
        break
      case 'down':
        row++
        if (row >= totalRows) return
        break
      case 'up':
        row--
        if (row < 0) return
        break
    }

    const targetField = grid[row]?.[col]
    if (!targetField) return
    const targetRow = displayedRows.value[row]
    if (isCellDisabled(targetRow, targetField)) {
      activeCell.value = { rowIndex: row, field: targetField }
      move(direction, depth + 1)
      return
    }

    activateCell(row, targetField)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!editable.value || !activeCell.value) return

    switch (e.key) {
      case 'Tab':
        e.preventDefault()
        move(e.shiftKey ? 'prev' : 'next')
        break
      case 'ArrowRight':
        if (editMode.value === 'cell') {
          e.preventDefault()
          move('right')
        }
        break
      case 'ArrowLeft':
        if (editMode.value === 'cell') {
          e.preventDefault()
          move('left')
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        move('down')
        break
      case 'ArrowUp':
        e.preventDefault()
        move('up')
        break
      case 'Enter':
        e.preventDefault()
        move('down')
        break
      case 'Escape':
        deactivateCell()
        break
    }
  }

  function activateCell(rowIndex: number, field: string) {
    activeCell.value = { rowIndex, field }
    nextTick(() => {
      const table = dataTableRef.value?.$el
      if (!table) return
      const rows = table.querySelectorAll('.p-datatable-tbody > tr')
      const row = rows[rowIndex]
      if (!row) return
      const input = row.querySelector(`[data-field="${field}"] input, [data-field="${field}"] select, [data-field="${field}"] .p-inputtext`)
      input?.focus()

      if (dataTableRef.value?.virtualScroller) {
        dataTableRef.value.virtualScroller.scrollToIndex(rowIndex)
      }
    })
  }

  function deactivateCell() {
    activeCell.value = null
  }

  function onCellEditComplete(event: any) {
    const { data, newData, field } = event
    const oldRow = JSON.parse(JSON.stringify(data))
    const key = data[rowKey.value]

    Object.assign(data, newData)
    dirtyRows.value.add(key)

    emit.editSave({
      oldRow,
      newRow: { ...data },
      field,
    })
  }

  function onRowEditSave(event: any) {
    const { data, newData } = event
    const oldRow = JSON.parse(JSON.stringify(data))
    const key = data[rowKey.value]

    Object.assign(data, newData)
    dirtyRows.value.add(key)

    emit.editSave({
      oldRow,
      newRow: { ...data },
    })
  }

  function getDirtyRows(): any[] {
    return rows.value.filter(row => dirtyRows.value.has(row[rowKey.value]))
  }

  function clearDirty(key?: string | number) {
    if (key !== undefined) {
      dirtyRows.value.delete(key)
    } else {
      dirtyRows.value.clear()
    }
  }

  return {
    activeCell,
    dirtyRows,
    editingRows,
    cellConfigs,
    handleKeyDown,
    onCellEditComplete,
    onRowEditSave,
    activateCell,
    deactivateCell,
    getDirtyRows,
    clearDirty,
    getEditableGrid,
    isCellEditable,
    isCellDisabled,
    getCellOptions,
    getCellDisplayValue,
  }
}
