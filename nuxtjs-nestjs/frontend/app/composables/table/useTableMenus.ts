import type { ColumnDef, EditSaveEvent, ExportFormat, ProcFlag } from '~/types/table'
import type { UseTableColumnsReturn } from './useTableColumns'
import type { UseTableSortReturn } from './useTableSort'
import type { UseTableSelectionReturn } from './useTableSelection'
import type { UseTableExportReturn } from './useTableExport'

export interface UseTableMenusOptions {
  editable: Ref<boolean | undefined>
  headerContextMenu: Ref<boolean | undefined>
  rowContextMenu: Ref<boolean | undefined>
  columns: UseTableColumnsReturn
  sort: UseTableSortReturn
  selection: UseTableSelectionReturn
  exportFn: UseTableExportReturn
  rows: Ref<any[]>
  rowKey: Ref<string>
  emit: {
    editSave: (payload: EditSaveEvent) => void
    refresh: () => void | Promise<void>
    fullScreenChange: (isFullscreen: boolean) => void
  }
  rootRef: Ref<HTMLElement | null>
  confirmAsync: (options: any) => Promise<boolean>
  procFlag: {
    markInsert: (key: string | number) => void
    markDelete: (key: string | number) => void
    getFlag: (key: string | number) => ProcFlag
  }
  generateTempKey: () => string
  columnState: ColumnDef[]
}

export interface UseTableMenusReturn {
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

export function useTableMenus(options: UseTableMenusOptions): UseTableMenusReturn {
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
    emit,
    rootRef,
    confirmAsync,
    procFlag,
    generateTempKey: genKey,
    columnState,
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
          command: () => sort.setSortAsc(col.field),
        },
        {
          label: t('table.sortDescending'),
          icon: 'pi pi-sort-amount-down',
          command: () => sort.setSortDesc(col.field),
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
        label: t('table.freezeColumn'),
        icon: 'pi pi-lock',
        command: () => columns.freezeColumn(col.field),
        disabled: columns.isColumnFrozen(col.field) || !columns.canFreezeMore.value,
      },
      {
        label: t('table.unfreezeColumn'),
        icon: 'pi pi-lock-open',
        command: () => columns.unfreezeColumn(col.field),
        disabled: !columns.isColumnFrozen(col.field),
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
        command: () => {
          sort.clearSort()
          columns.resetColumns()
        },
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

  function createBlankRow(): any {
    const blank: any = {}
    for (const col of columnState) {
      blank[col.field] = null
    }
    blank[rowKey.value] = genKey()
    return blank
  }

  function insertRow(position: 'above' | 'below') {
    const idx = rows.value.indexOf(rightClickedRow.value)
    if (idx === -1) return
    const blank = createBlankRow()
    const insertIdx = position === 'above' ? idx : idx + 1
    rows.value.splice(insertIdx, 0, blank)
    triggerRef(rows)
    procFlag.markInsert(blank[rowKey.value])
    emit.editSave({ oldRow: null, newRow: blank })
  }

  function duplicateRow() {
    const idx = rows.value.indexOf(rightClickedRow.value)
    if (idx === -1) return
    const copy = JSON.parse(JSON.stringify(rightClickedRow.value))
    const newKey = genKey()
    copy[rowKey.value] = newKey
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
    const key = rightClickedRow.value[rowKey.value]
    procFlag.markDelete(key)
  }

  async function deleteSelected() {
    const confirmed = await confirmAsync({
      message: t('table.deleteConfirmMessage'),
    })
    if (!confirmed) return
    const keys = selection.selectedRows.value.map((r: any) => r[rowKey.value])
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
