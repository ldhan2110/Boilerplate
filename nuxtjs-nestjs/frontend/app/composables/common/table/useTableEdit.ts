import type { VNode } from 'vue'
import type { ColumnDef, CellConfig, EditSaveEvent } from '~/types/table'
import { ROW_ID } from './useTableProcFlag'

export interface UseTableEditOptions {
  editable: Ref<boolean | undefined>
  editableColumns: Ref<string[] | undefined>
  columnState: ColumnDef[]
  visibleColumns: Ref<ColumnDef[]>
  rows: Ref<any[]>
  displayedRows: Ref<any[]>
  cellConfig: Ref<((row: any, field: string) => CellConfig | void) | undefined>
  dataTableRef: Ref<any>
  emit: {
    editSave: (payload: EditSaveEvent) => void
  }
  // Span support (optional -- undefined when no span active)
  getBodyRowSpan?: (row: any, field: string, index: number) => number
  getMergeGroupIndices?: (index: number, field: string) => number[]
}

export interface UseTableEditReturn {
  activeCell: Ref<{ rowKey: string | number; field: string } | null>
  dirtyRows: Ref<Set<string | number>>
  editingRows: Ref<any[]>
  cellConfigs: Ref<Map<string | number, Record<string, CellConfig>>>
  handleKeyDown: (e: KeyboardEvent) => void
  onCellEditInit: (event: any) => void
  onCellEditComplete: (event: any) => void
  onEditorValueChange: (field: string, value: any) => void
  activateCell: (rowKey: string | number, field: string) => void
  deactivateCell: () => void
  getDirtyRows: () => any[]
  clearDirty: (rowKey?: string | number) => void
  getEditableGrid: () => string[][]
  isCellEditable: (row: any, field: string) => boolean
  isCellDisabled: (row: any, field: string) => boolean
  getCellOptions: (row: any, col: ColumnDef) => any[] | undefined
  getCellDisplayValue: (val: any, row: any, col: ColumnDef) => string | VNode | VNode[]
  onInlineToggle: (row: any, field: string, val: any) => void
}

export function useTableEdit(options: UseTableEditOptions): UseTableEditReturn {
  const {
    editable,
    editableColumns,
    columnState,
    visibleColumns,
    rows,
    displayedRows,
    cellConfig,
    dataTableRef,
    emit,
    getBodyRowSpan,
    getMergeGroupIndices,
  } = options

  const activeCell = ref<{ rowKey: string | number; field: string } | null>(null)
  const dirtyRows = ref(new Set<string | number>())
  const editingRows = ref<any[]>([])

  const cellConfigs = computed(() => {
    const map = new Map<string | number, Record<string, CellConfig>>()
    if (!cellConfig.value) return map

    for (const row of displayedRows.value) {
      const key = row[ROW_ID]
      const rowConfigs: Record<string, CellConfig> = {}
      for (const col of visibleColumns.value) {
        if (!col.field) continue
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
    const key = row[ROW_ID]
    return cellConfigs.value.get(key)?.[field]
  }

  function isCellEditable(row: any, field: string): boolean {
    if (!editable.value) return false
    const config = getCellConfig(row, field)
    if (config?.editable === false) return false
    if (config?.disabled) return false
    if (editableColumns.value?.length && !editableColumns.value.includes(field)) return false
    const col = columnState.find(c => c.field === field)
    if (col?.editable === false) return false
    return true
  }

  function isCellDisabled(row: any, field: string): boolean {
    const config = getCellConfig(row, field)
    return config?.disabled === true
  }

  function getCellOptions(row: any, col: ColumnDef): any[] | undefined {
    const config = getCellConfig(row, col.field!)
    return config?.options ?? col.editOptions
  }

  function getCellDisplayValue(val: any, row: any, col: ColumnDef): string | VNode | VNode[] {
    const config = getCellConfig(row, col.field!)
    if (config?.render) return config.render(val, row)
    if (col.format) return col.format(val, row)
    if (col.editType === 'checkbox' || col.editType === 'toggle') {
      return val ? 'Yes' : 'No'
    }
    return val?.toString() ?? ''
  }

  function getEditableGrid(): string[][] {
    const editableCols = visibleColumns.value.filter(col => {
      if (col.editable === false) return false
      if (!col.field) return false
      if (editableColumns.value && !editableColumns.value.includes(col.field)) return false
      return true
    })
    return displayedRows.value.map(() => editableCols.map(col => col.field!))
  }

  function findRowIndex(rowKey: string | number): number {
    return displayedRows.value.findIndex(r => r[ROW_ID] === rowKey)
  }

  function findCellPosition(rowKey: string | number, field: string): { row: number; col: number } | null {
    const rowIndex = findRowIndex(rowKey)
    if (rowIndex === -1) return null
    const grid = getEditableGrid()
    if (rowIndex >= grid.length) return null
    const colIndex = grid[rowIndex]?.indexOf(field) ?? -1
    if (colIndex === -1) return null
    return { row: rowIndex, col: colIndex }
  }

  function shouldNavigate(direction: 'left' | 'right'): boolean {
    const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null
    if (!el || !('selectionStart' in el)) return true
    const { selectionStart, selectionEnd, value } = el
    if (selectionStart !== selectionEnd) return false
    if (direction === 'left') return selectionStart === 0
    if (direction === 'right') return selectionStart === value.length
    return false
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!editable.value || !activeCell.value) return

    switch (e.key) {
      case 'Tab':
        e.preventDefault()
        move(e.shiftKey ? 'prev' : 'next')
        break
      case 'ArrowUp':
        e.preventDefault()
        move('up')
        break
      case 'ArrowDown':
        e.preventDefault()
        move('down')
        break
      case 'ArrowLeft':
        if (!shouldNavigate('left')) return
        e.preventDefault()
        move('left')
        break
      case 'ArrowRight':
        if (!shouldNavigate('right')) return
        e.preventDefault()
        move('right')
        break
      case 'Enter': {
        e.preventDefault()
        const { rowKey, field } = activeCell.value
        const col = visibleColumns.value.find(c => c.field === field)
        if (col && (col.editType === 'checkbox' || col.editType === 'toggle')) {
          const rowIndex = findRowIndex(rowKey)
          const row = displayedRows.value[rowIndex]
          if (row && isCellEditable(row, field) && !isCellDisabled(row, field)) {
            onInlineToggle(row, field, !row[field])
          }
        } else {
          move('down')
        }
        break
      }
      case 'Escape':
        deactivateCell()
        break
    }
  }

  function move(direction: 'next' | 'prev' | 'up' | 'down' | 'left' | 'right', depth = 0) {
    if (!activeCell.value || depth > 50) return
    const grid = getEditableGrid()
    const pos = findCellPosition(activeCell.value.rowKey, activeCell.value.field)
    if (!pos) return

    let { row, col } = pos
    const totalRows = grid.length
    const totalCols = grid[0]?.length ?? 0
    if (totalRows === 0 || totalCols === 0) return

    switch (direction) {
      case 'next':
        col++
        if (col >= totalCols) { col = 0; row++ }
        if (row >= totalRows) return
        break
      case 'prev':
        col--
        if (col < 0) { col = totalCols - 1; row-- }
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
    if (!targetRow) return
    const targetKey = targetRow[ROW_ID]

    if (getBodyRowSpan) {
      const spanVal = getBodyRowSpan(targetRow, targetField, row)
      if (spanVal === 0) {
        activeCell.value = { rowKey: targetKey, field: targetField }
        move(direction, depth + 1)
        return
      }
    }

    if (isCellDisabled(targetRow, targetField)) {
      activeCell.value = { rowKey: targetKey, field: targetField }
      move(direction, depth + 1)
      return
    }

    activateCell(targetKey, targetField)
  }

  function onCellEditInit(event: any) {
    const { data, field } = event
    if (data && field) {
      const key = data[ROW_ID]
      if (key !== undefined) {
        activeCell.value = { rowKey: key, field }
      }
    }
  }

  function focusEditorElement(container: Element) {
    // Checkbox / Toggle: focus the hidden input inside the wrapper
    const checkbox = container.querySelector<HTMLElement>('.p-checkbox input, .p-toggleswitch input')
    if (checkbox) { checkbox.focus(); return }

    // PSelect / PMultiSelect: focusable element is a span[role="combobox"], not an input
    const combobox = container.querySelector<HTMLElement>('[role="combobox"]')
    if (combobox) { combobox.focus(); return }

    // PDatePicker: block focus event to prevent popup overlay via onFocus→showOnFocus
    const datePicker = container.querySelector<HTMLElement>('[data-pc-name="datepicker"]')
    if (datePicker) {
      const dateInput = datePicker.querySelector<HTMLInputElement>('input')
      if (dateInput) {
        const blocker = (e: FocusEvent) => e.stopImmediatePropagation()
        dateInput.addEventListener('focus', blocker, { capture: true, once: true })
        dateInput.focus()
      }
      return
    }

    // PInputText, PInputNumber: standard input element
    const input = container.querySelector<HTMLElement>('input, .p-inputtext')
    if (input) { input.focus() }
  }

  function completeEditingCell(table: Element) {
    const editingTd = table.querySelector('td[data-p-cell-editing="true"]')
    if (editingTd) {
      editingTd.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: false,
        cancelable: true,
      }))
    }
  }

  function activateCell(rowKey: string | number, field: string) {
    activeCell.value = { rowKey, field }

    nextTick(() => {
      const table = dataTableRef.value?.$el
      if (!table) return

      const rowIndex = findRowIndex(rowKey)
      if (rowIndex === -1) return

      if (dataTableRef.value?.virtualScroller) {
        dataTableRef.value.virtualScroller.scrollToIndex(rowIndex)
      }

      completeEditingCell(table)

      nextTick(() => {
        const freshIndex = findRowIndex(rowKey)
        if (freshIndex === -1) return

        const rows = table.querySelectorAll('.p-datatable-tbody > tr')
        const row = rows[freshIndex]
        if (!row) return

        const cell = row.querySelector(`[data-field="${field}"]`)?.closest('td')
        if (!cell) return

        cell.click()

        nextTick(() => {
          const container = row.querySelector(`[data-field="${field}"]`)
          if (!container) return
          focusEditorElement(container)
        })
      })
    })
  }

  function deactivateCell() {
    const table = dataTableRef.value?.$el
    if (table) completeEditingCell(table)
    activeCell.value = null
  }

  // Track the last value emitted by the cell editor so we can merge it in
  // onCellEditComplete even when PrimeVue's editingMeta didn't capture it
  // (happens with datetime/time manual input due to PrimeVue parseDateTime bug).
  let lastEditorValue: { field: string; value: any } | null = null

  function onEditorValueChange(field: string, value: any) {
    lastEditorValue = { field, value }
  }

  function onCellEditComplete(event: any) {
    const { data, newData, field } = event
    const oldRow = JSON.parse(JSON.stringify(data))
    const key = data[ROW_ID]

    // Merge last editor-emitted value if PrimeVue's editingMeta missed it
    if (lastEditorValue && lastEditorValue.field === field) {
      newData[field] = lastEditorValue.value
    }
    lastEditorValue = null

    // Capture merge group BEFORE mutating data — mutation triggers spanMap
    // recompute which breaks the group apart before we can read it
    let groupIndices: number[] | null = null
    if (getMergeGroupIndices && getBodyRowSpan) {
      const index = displayedRows.value.indexOf(data)
      if (index !== -1) {
        const col = visibleColumns.value.find(c => c.field === field)
        if (col?.rowSpan) {
          groupIndices = getMergeGroupIndices(index, field)
        }
      }
    }

    Object.assign(data, newData)
    dirtyRows.value.add(key)

    // Update all rows in the merge group
    if (groupIndices) {
      const index = displayedRows.value.indexOf(data)
      for (const gi of groupIndices) {
        if (gi === index) continue // already updated above
        const groupRow = displayedRows.value[gi]
        if (!groupRow) continue
        groupRow[field] = newData[field]
        const groupKey = groupRow[ROW_ID]
        dirtyRows.value.add(groupKey)
        emit.editSave({
          oldRow: JSON.parse(JSON.stringify({ ...groupRow, [field]: oldRow[field] })),
          newRow: { ...groupRow },
          field,
        })
      }
    }

    emit.editSave({
      oldRow,
      newRow: { ...data },
      field,
    })
  }

  function onInlineToggle(row: any, field: string, val: any) {
    const oldRow = JSON.parse(JSON.stringify(row))

    // Capture merge group BEFORE mutating data
    let groupIndices: number[] | null = null
    if (getMergeGroupIndices && getBodyRowSpan) {
      const index = displayedRows.value.indexOf(row)
      if (index !== -1) {
        const col = visibleColumns.value.find(c => c.field === field)
        if (col?.rowSpan) {
          groupIndices = getMergeGroupIndices(index, field)
        }
      }
    }

    row[field] = val
    const key = row[ROW_ID]
    dirtyRows.value.add(key)

    // Update all rows in the merge group
    if (groupIndices) {
      const index = displayedRows.value.indexOf(row)
      for (const gi of groupIndices) {
        if (gi === index) continue
        const groupRow = displayedRows.value[gi]
        if (!groupRow) continue
        groupRow[field] = val
        const groupKey = groupRow[ROW_ID]
        dirtyRows.value.add(groupKey)
        emit.editSave({
          oldRow: JSON.parse(JSON.stringify({ ...groupRow, [field]: oldRow[field] })),
          newRow: { ...groupRow },
          field,
        })
      }
    }

    emit.editSave({
      oldRow,
      newRow: { ...row },
      field,
    })
  }

  function getDirtyRows(): any[] {
    return rows.value.filter(row => dirtyRows.value.has(row[ROW_ID]))
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
    onCellEditInit,
    onCellEditComplete,
    onEditorValueChange,
    activateCell,
    deactivateCell,
    getDirtyRows,
    clearDirty,
    getEditableGrid,
    isCellEditable,
    isCellDisabled,
    getCellOptions,
    getCellDisplayValue,
    onInlineToggle,
  }
}
