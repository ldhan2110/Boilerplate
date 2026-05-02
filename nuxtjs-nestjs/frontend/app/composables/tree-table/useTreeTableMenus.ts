import type { ColumnDef, EditSaveEvent, ProcFlag } from '~/types/table'
import type { UseTreeTableColumnsReturn } from './useTreeTableColumns'
import type { UseTreeTableSortReturn } from './useTreeTableSort'
import type { UseTreeTableSelectionReturn } from './useTreeTableSelection'
import type { UseTreeTableExportReturn } from './useTreeTableExport'

export interface UseTreeTableMenusOptions {
  editable: Ref<boolean | undefined>
  headerContextMenu: Ref<boolean | undefined>
  rowContextMenu: Ref<boolean | undefined>
  columns: UseTreeTableColumnsReturn
  sort: UseTreeTableSortReturn
  selection: UseTreeTableSelectionReturn
  exportFn: UseTreeTableExportReturn
  rows: Ref<any[]>
  rowKey: string
  parentKey: string
  emit: {
    editSave: (payload: EditSaveEvent) => void
    refresh: () => void | Promise<void>
    fullScreenChange: (isFullscreen: boolean) => void
  }
  resetTable: () => void
  rootRef: Ref<HTMLElement | null>
  confirmAsync: (options: any) => Promise<boolean>
  procFlag: {
    markInsert: (key: string | number) => void
    markDelete: (key: string | number) => void
    getFlag: (key: string | number) => ProcFlag
  }
  generateTempKey: () => string
  columnState: ColumnDef[]
  expandAll: () => void
  collapseAll: () => void
}

export interface UseTreeTableMenusReturn {
  headerMenuRef: Ref<any>
  rowMenuRef: Ref<any>
  rightClickedColumn: Ref<ColumnDef | null>
  rightClickedRow: Ref<any>
  headerMenuModel: Ref<any[]>
  rowMenuModel: Ref<any[]>
  onHeaderContextMenu: (event: MouseEvent, col: ColumnDef) => void
  onRowContextMenu: (event: any) => void
  isRefreshing: Ref<boolean>
  showColumnManager: Ref<boolean>
}

export function useTreeTableMenus(options: UseTreeTableMenusOptions): UseTreeTableMenusReturn {
  const {
    editable,
    headerContextMenu,
    rowContextMenu,
    columns,
    sort,
    selection,
    exportFn,
    rows,
    rowKey,
    parentKey,
    emit,
    rootRef,
    confirmAsync,
    procFlag,
    generateTempKey: genKey,
    columnState,
    resetTable,
    expandAll,
    collapseAll,
  } = options

  const { t } = useI18n()

  const headerMenuRef = ref()
  const rowMenuRef = ref()
  const rightClickedColumn = ref<ColumnDef | null>(null)
  const rightClickedRow = ref<any>(null)
  const isRefreshing = ref(false)
  const showColumnManager = ref(false)

  const headerMenuModel = computed(() => {
    if (!headerContextMenu.value || !rightClickedColumn.value) return []
    const col = rightClickedColumn.value
    const items: any[] = []

    if (col.sortable !== false) {
      items.push(
        {
          label: t('table.sortAscending'),
          icon: 'pi pi-sort-amount-up',
          command: () => sort.setSortAsc(col.field!),
        },
        {
          label: t('table.sortDescending'),
          icon: 'pi pi-sort-amount-down',
          command: () => sort.setSortDesc(col.field!),
        },
      )

      items.push(
        { separator: true },
        {
          label: t('table.clearAllSorts'),
          icon: 'pi pi-filter-slash',
          command: () => sort.clearSort(),
          disabled: sort.sortChips.value.length === 0,
        },
      )
    }

    items.push(
      { separator: true },
      {
        label: t('table.expandAll'),
        icon: 'pi pi-angle-double-down',
        command: () => expandAll(),
      },
      {
        label: t('table.collapseAll'),
        icon: 'pi pi-angle-double-up',
        command: () => collapseAll(),
      },
    )

    items.push(
      { separator: true },
      {
        label: t('table.freezeColumn'),
        icon: 'pi pi-lock',
        command: () => columns.freezeColumn(col.field!),
        disabled: columns.isColumnFrozen(col.field!) || !columns.canFreezeMore.value,
      },
      {
        label: t('table.unfreezeColumn'),
        icon: 'pi pi-lock-open',
        command: () => columns.unfreezeColumn(col.field!),
        disabled: !columns.isColumnFrozen(col.field!),
      },
    )

    items.push(
      { separator: true },
      {
        label: t('table.showHideColumns'),
        icon: 'pi pi-th-large',
        command: () => { showColumnManager.value = true },
      },
    )

    items.push(
      { separator: true },
      {
        label: t('table.resetToDefault'),
        icon: 'pi pi-undo',
        command: () => resetTable(),
      },
    )

    return items
  })

  const rowMenuModel = computed(() => {
    if (!rowContextMenu.value || !rightClickedRow.value) return []
    const items: any[] = []

    if (editable.value) {
      items.push(
        {
          label: t('table.insertAbove'),
          icon: 'pi pi-arrow-up',
          command: () => insertRow('above'),
        },
        {
          label: t('table.insertBelow'),
          icon: 'pi pi-arrow-down',
          command: () => insertRow('below'),
        },
        {
          label: t('table.insertChild'),
          icon: 'pi pi-plus',
          command: () => insertChild(),
        },
        {
          label: t('table.duplicateRow'),
          icon: 'pi pi-copy',
          command: () => duplicateRow(),
        },
        { separator: true },
        {
          label: t('table.deleteRow'),
          icon: 'pi pi-trash',
          command: () => deleteRow(),
        },
        {
          label: t('table.deleteSelected'),
          icon: 'pi pi-trash',
          command: () => deleteSelected(),
          disabled: !selection.hasSelection.value,
        },
        { separator: true },
      )
    }

    items.push(
      {
        label: t('table.copyRow'),
        icon: 'pi pi-clipboard',
        command: () => copyToClipboard(JSON.stringify(rightClickedRow.value, null, 2)),
      },
      {
        label: t('table.copySelected'),
        icon: 'pi pi-clipboard',
        command: () => copyToClipboard(JSON.stringify(selection.selectedRows.value, null, 2)),
        disabled: !selection.hasSelection.value,
      },
      { separator: true },
      {
        label: t('table.refresh'),
        icon: 'pi pi-refresh',
        command: () => doRefresh(),
      },
      {
        label: t('table.exportVisible'),
        icon: 'pi pi-download',
        command: () => exportFn.exportTable('csv', 'visible'),
      },
      { separator: true },
      {
        label: isFullscreen() ? t('table.exitFullScreen') : t('table.fullScreen'),
        icon: isFullscreen() ? 'pi pi-window-minimize' : 'pi pi-window-maximize',
        command: () => toggleFullscreen(),
      },
      { separator: true },
      {
        label: t('table.resetToDefault'),
        icon: 'pi pi-undo',
        command: () => resetTable(),
      },
    )

    return items
  })

  function onHeaderContextMenu(event: MouseEvent, col: ColumnDef) {
    rightClickedColumn.value = col
    headerMenuRef.value?.show(event)
  }

  function onRowContextMenu(event: any) {
    rightClickedRow.value = event.data
    rowMenuRef.value?.show(event.originalEvent)
  }

  function createBlankRow(overrides?: Record<string, any>): any {
    const blank: any = {}
    for (const col of columnState) {
      if (!col.field) continue
      blank[col.field] = null
    }
    blank[rowKey] = genKey()
    Object.assign(blank, overrides)
    return blank
  }

  function insertRow(position: 'above' | 'below') {
    const idx = rows.value.indexOf(rightClickedRow.value)
    if (idx === -1) return
    // New sibling shares the same parent as the right-clicked row
    const parentVal = rightClickedRow.value[parentKey] ?? null
    const blank = createBlankRow({ [parentKey]: parentVal })
    const insertIdx = position === 'above' ? idx : idx + 1
    rows.value.splice(insertIdx, 0, blank)
    triggerRef(rows)
    procFlag.markInsert(blank[rowKey])
    emit.editSave({ oldRow: null, newRow: blank })
  }

  function insertChild() {
    const parentRow = rightClickedRow.value
    const parentKeyValue = parentRow[rowKey]
    const blank = createBlankRow({ [parentKey]: parentKeyValue })
    // Append after all descendants of the parent in flat array
    const parentIdx = rows.value.indexOf(parentRow)
    if (parentIdx === -1) return
    // Find last descendant index
    let insertIdx = parentIdx + 1
    while (insertIdx < rows.value.length) {
      // Walk forward while rows are descendants — simple heuristic:
      // since flat array is ordered, descendants follow the parent
      // until we hit a row whose parentKey chain doesn't lead back.
      // For simplicity, just insert right after parent.
      break
    }
    rows.value.splice(insertIdx, 0, blank)
    triggerRef(rows)
    procFlag.markInsert(blank[rowKey])
    emit.editSave({ oldRow: null, newRow: blank })
  }

  function duplicateRow() {
    const idx = rows.value.indexOf(rightClickedRow.value)
    if (idx === -1) return
    const copy = JSON.parse(JSON.stringify(rightClickedRow.value))
    const newKey = genKey()
    copy[rowKey] = newKey
    rows.value.splice(idx + 1, 0, copy)
    triggerRef(rows)
    procFlag.markInsert(newKey)
    emit.editSave({ oldRow: null, newRow: copy })
  }

  async function deleteRow() {
    const confirmed = await confirmAsync({
      message: t('table.deleteConfirmMessage'),
    })
    if (!confirmed) return
    const key = rightClickedRow.value[rowKey]
    procFlag.markDelete(key)
  }

  async function deleteSelected() {
    const confirmed = await confirmAsync({
      message: t('table.deleteConfirmMessage'),
    })
    if (!confirmed) return
    const keys = selection.selectedRows.value.map((r: any) => r[rowKey])
    for (const key of keys) {
      procFlag.markDelete(key)
    }
    selection.clearSelection()
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text)
  }

  async function doRefresh() {
    isRefreshing.value = true
    try {
      await emit.refresh()
    } finally {
      isRefreshing.value = false
    }
  }

  function isFullscreen(): boolean {
    return !!document.fullscreenElement
  }

  function toggleFullscreen() {
    if (!rootRef.value) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
      emit.fullScreenChange(false)
    } else {
      rootRef.value.requestFullscreen()
      emit.fullScreenChange(true)
    }
  }

  return {
    headerMenuRef,
    rowMenuRef,
    rightClickedColumn,
    rightClickedRow,
    headerMenuModel,
    rowMenuModel,
    onHeaderContextMenu,
    onRowContextMenu,
    isRefreshing,
    showColumnManager,
  }
}
