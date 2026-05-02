import type { ColumnDef, CellConfig, EditSaveEvent } from '~/types/table'

export interface UseTreeTableEditOptions {
  editable: Ref<boolean | undefined>
  editableColumns: Ref<string[] | undefined>
  columnState: ColumnDef[]
  visibleColumns: Ref<ColumnDef[]>
  rows: Ref<any[]>
  displayedRows: Ref<any[]>
  cellConfig: Ref<((row: any, field: string) => CellConfig | void) | undefined>
  rowKey: string
  emit: {
    editSave: (payload: EditSaveEvent) => void
  }
}

export interface UseTreeTableEditReturn {
  editingCell: Ref<{ nodeKey: string | number; field: string } | null>
  dirtyRows: Ref<Set<string | number>>
  cellConfigs: Ref<Map<string | number, Record<string, CellConfig>>>
  startEdit: (nodeKey: string | number, field: string) => void
  commitEdit: (nodeKey: string | number, field: string, oldValue: any, newValue: any) => void
  cancelEdit: () => void
  isEditing: (nodeKey: string | number, field: string) => boolean
  onEditorValueChange: (field: string, value: any) => void
  getDirtyRows: () => any[]
  clearDirty: (key?: string | number) => void
  isCellEditable: (row: any, field: string) => boolean
  isCellDisabled: (row: any, field: string) => boolean
  getCellOptions: (row: any, col: ColumnDef) => any[] | undefined
  getCellDisplayValue: (val: any, row: any, col: ColumnDef) => string
  onInlineToggle: (row: any, field: string, val: any) => void
}

export function useTreeTableEdit(options: UseTreeTableEditOptions): UseTreeTableEditReturn {
  const {
    editable,
    editableColumns,
    columnState,
    visibleColumns,
    rows,
    displayedRows,
    cellConfig,
    rowKey,
    emit,
  } = options

  const editingCell = ref<{ nodeKey: string | number; field: string } | null>(null)
  const dirtyRows = ref(new Set<string | number>())

  const cellConfigs = computed(() => {
    const map = new Map<string | number, Record<string, CellConfig>>()
    if (!cellConfig.value) return map

    for (const row of displayedRows.value) {
      const key = row[rowKey]
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
    const key = row[rowKey]
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

  function getCellDisplayValue(val: any, row: any, col: ColumnDef): string {
    const config = getCellConfig(row, col.field!)
    if (config?.render) return config.render(val, row)
    if (col.format) return col.format(val, row)
    if (col.editType === 'checkbox' || col.editType === 'toggle') {
      return val ? 'Yes' : 'No'
    }
    return val?.toString() ?? ''
  }

  function findRowByKey(nodeKey: string | number): any | undefined {
    return displayedRows.value.find(r => r[rowKey] === nodeKey)
  }

  function startEdit(nodeKey: string | number, field: string): void {
    const row = findRowByKey(nodeKey)
    if (!row) return
    if (!isCellEditable(row, field)) return
    if (isCellDisabled(row, field)) return
    editingCell.value = { nodeKey, field }
  }

  function commitEdit(nodeKey: string | number, field: string, oldValue: any, newValue: any): void {
    const row = findRowByKey(nodeKey)
    if (!row) return

    const oldRow = JSON.parse(JSON.stringify(row))

    // Merge last editor-emitted value if available
    if (lastEditorValue && lastEditorValue.field === field) {
      newValue = lastEditorValue.value
    }
    lastEditorValue = null

    row[field] = newValue
    dirtyRows.value.add(nodeKey)

    emit.editSave({
      oldRow,
      newRow: { ...row },
      field,
    })

    editingCell.value = null
  }

  function cancelEdit(): void {
    editingCell.value = null
    lastEditorValue = null
  }

  function isEditing(nodeKey: string | number, field: string): boolean {
    if (!editingCell.value) return false
    return editingCell.value.nodeKey === nodeKey && editingCell.value.field === field
  }

  // Track the last value emitted by the cell editor so we can merge it in
  // commitEdit even when the component didn't capture it directly
  let lastEditorValue: { field: string; value: any } | null = null

  function onEditorValueChange(field: string, value: any) {
    lastEditorValue = { field, value }
  }

  function onInlineToggle(row: any, field: string, val: any) {
    const oldRow = JSON.parse(JSON.stringify(row))

    row[field] = val
    const key = row[rowKey]
    dirtyRows.value.add(key)

    emit.editSave({
      oldRow,
      newRow: { ...row },
      field,
    })
  }

  function getDirtyRows(): any[] {
    return rows.value.filter(row => dirtyRows.value.has(row[rowKey]))
  }

  function clearDirty(key?: string | number) {
    if (key !== undefined) {
      dirtyRows.value.delete(key)
    } else {
      dirtyRows.value.clear()
    }
  }

  return {
    editingCell,
    dirtyRows,
    cellConfigs,
    startEdit,
    commitEdit,
    cancelEdit,
    isEditing,
    onEditorValueChange,
    getDirtyRows,
    clearDirty,
    isCellEditable,
    isCellDisabled,
    getCellOptions,
    getCellDisplayValue,
    onInlineToggle,
  }
}
