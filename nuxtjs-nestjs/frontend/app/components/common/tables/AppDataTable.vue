<script setup lang="ts">
import type {
  ColumnDef,
  AppDataTableProps,
  PageEvent,
  SortEvent,
  EditSaveEvent,
  ExportFormat,
  ProcFlag} from '~/types/table'
import type { HeaderCell } from '~/composables/table/useTableSpan'
import {
  useTableColumns,
  useTableSort,
  useTablePagination,
  useTableSelection,
  useTableEdit,
  useTableValidation,
  useTableFooter,
  useTableExport,
  useTableMenus,
  useTableProcFlag,
  useTableSpan,
  useTableColumnDrag,
  generateTempKey,
  ROW_ID
} from '~/composables/table'

// --- v-row-span directive ---
const vRowSpan = {
  mounted(el: HTMLElement, binding: { value: number }) {
    applyRowSpan(el, binding.value)
  },
  updated(el: HTMLElement, binding: { value: number }) {
    applyRowSpan(el, binding.value)
  }
}

function applyRowSpan(el: HTMLElement, span: number) {
  const td = el.closest('td')
  if (!td) return

  if (span === 0) {
    td.style.display = 'none'
    td.removeAttribute('rowspan')
  } else {
    td.style.display = ''
    if (span > 1) {
      td.rowSpan = span
    } else {
      td.removeAttribute('rowspan')
    }
  }
}

const props = withDefaults(defineProps<AppDataTableProps>(), {
  dataMode: 'pagination',
  virtualScroll: false,
  pageSize: 25,
  pageSizeOptions: () => [10, 25, 50, 100],
  paginationMode: 'server',
  virtualRowHeight: 46,
  scrollHeight: '600px',
  sortBackend: 'server',
  defaultSortOrder: 1,
  editable: false,
  selectable: false,
  selectionMode: 'multiple',
  tableHeight: undefined,
  showGridlines: true,
  stripedRows: false,
  resizableColumns: true,
  reorderableColumns: true,
  stickyHeader: true,
  maxFrozenColumns: 3,
  showFooter: false,
  rowContextMenu: true,
  headerContextMenu: true,
  exportFilename: 'export',
  defaultColumnWidth: 150,
  footerAggregations: () => [],
  exportFormats: () => ['csv', 'xlsx'] as ExportFormat[],
  frozenColumns: () => [],
  editableColumns: undefined
})

const emit = defineEmits<{
  (e: 'page', payload: PageEvent): void
  (e: 'sort', payload: SortEvent): void
  (e: 'row-edit-save', payload: EditSaveEvent): void
  (e: 'load-more'): void
  (e: 'full-screen-change', isFullscreen: boolean): void
  (e: 'selection-change', selected: any[]): void
  (e: 'refresh'): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const dataTableRef = ref<any>(null)

// Reactive prop refs for composables
const rowsRef = shallowRef(props.rows)
watch(() => props.rows, (val) => { rowsRef.value = val }, { flush: 'sync' })

// Stamp internal row ID on every row
function stampRowIds(rows: any[]) {
  for (const row of rows) {
    if (!row[ROW_ID]) row[ROW_ID] = generateTempKey()
  }
}
watch(rowsRef, (rows) => stampRowIds(rows), { immediate: true, flush: 'sync' })

const columnsRef = computed(() => props.columns)
const totalRecordsRef = computed(() => props.totalRecords)
const frozenColumnsRef = computed(() => props.frozenColumns)
const maxFrozenColumnsRef = computed(() => props.maxFrozenColumns)
const defaultColumnWidthRef = computed(() => props.defaultColumnWidth)
const sortBackendRef = computed(() => props.sortBackend)
const defaultSortFieldRef = computed(() => props.defaultSortField)
const defaultSortOrderRef = computed(() => props.defaultSortOrder)
const dataModeRef = computed(() => props.dataMode)
const pageSizeRef = computed(() => props.pageSize)
const pageSizeOptionsRef = computed(() => props.pageSizeOptions)
const paginationModeRef = computed(() => props.paginationMode)
const virtualScrollRef = computed(() => props.dataMode === 'infiniteScroll' ? true : props.virtualScroll)
const onLoadMoreRef = computed(() => props.onLoadMore)
const selectableRef = computed(() => props.selectable)
const selectionModeRef = computed(() => props.selectionMode)
const editableRef = computed(() => props.editable)
const editableColumnsRef = computed(() => props.editableColumns)
const showFooterRef = computed(() => props.showFooter)
const footerAggregationsRef = computed(() => props.footerAggregations)
const headerContextMenuRef = computed(() => props.headerContextMenu)
const rowContextMenuRef = computed(() => props.rowContextMenu)
const exportFilenameRef = computed(() => props.exportFilename)
const cellConfigRef = computed(() => props.cellConfig)
const reorderableColumnsRef = computed(() => props.reorderableColumns)

// --- Wire composables ---
const columns = useTableColumns({
  columns: columnsRef,
  frozenColumns: frozenColumnsRef,
  maxFrozenColumns: maxFrozenColumnsRef,
  defaultColumnWidth: defaultColumnWidthRef
})

const sort = useTableSort({
  sortBackend: sortBackendRef,
  defaultSortField: defaultSortFieldRef,
  defaultSortOrder: defaultSortOrderRef,
  emit: (_, payload) => emit('sort', payload)
})

const pagination = useTablePagination({
  dataMode: dataModeRef,
  paginationMode: paginationModeRef,
  pageSize: pageSizeRef,
  pageSizeOptions: pageSizeOptionsRef,
  rows: rowsRef,
  totalRecords: totalRecordsRef,
  virtualScroll: virtualScrollRef,
  onLoadMore: onLoadMoreRef,
  emit: {
    page: payload => emit('page', payload),
    loadMore: () => emit('load-more')
  }
})

// Reactive ref from columnState so span/drag track reorders + visibility changes
const columnStateRef = computed(() => [...columns.columnState])

const span = useTableSpan({
  columns: columnStateRef,
  displayedRows: pagination.displayedRows
})

// Warn if virtual scroll + rowSpan used together (unsupported)
if (import.meta.dev) {
  watch([virtualScrollRef, span.spanFields], ([vs, fields]) => {
    if (vs && fields.length > 0) {
      console.warn('[AppDataTable] rowSpan is not supported with virtual scroll. Row merging will not work correctly with recycled DOM rows.')
    }
  }, { immediate: true })
}

const bodyColumns = computed(() => {
  if (span.hasColumnGroups.value) {
    return span.leafColumns.value.filter(col => !col.hidden)
  }
  return columns.visibleColumns.value
})

const columnDrag = useTableColumnDrag({
  columns: columnStateRef,
  hasColumnGroups: span.hasColumnGroups,
  headerRows: span.headerRows,
  reorderableColumns: reorderableColumnsRef,
  columnsApi: columns
})

/** Resolve a HeaderCell to its top-level column index (for CSS class binding). */
function resolveHeaderCellGroup(cell: HeaderCell): number | null {
  const cols = columns.columnState
  if (cell.field) {
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i]!
      if (col.children?.length) {
        if (col.children.some(c => c.field === cell.field)) return i
      } else if (col.field === cell.field) {
        return i
      }
    }
    return null
  }
  // Group header
  return cols.findIndex(col => col.children?.length && col.header === cell.header)
}

/**
 * Flat list for column manager: groups become section headers, leaves are toggleable.
 * Each item tracks parentIndex/childIndex for up/down reorder.
 */
interface ColumnManagerItem {
  col: ColumnDef
  isGroup: boolean
  parentIndex: number // top-level index in columnState
  childIndex: number | null // index within parent.children (null for top-level/group)
  isFirst: boolean // first in its reorder scope
  isLast: boolean // last in its reorder scope
}

const columnManagerItems = computed<ColumnManagerItem[]>(() => {
  const items: ColumnManagerItem[] = []
  const state = columns.columnState
  for (let pi = 0; pi < state.length; pi++) {
    const col = state[pi]!
    if (col.children?.length) {
      // Group header
      items.push({ col, isGroup: true, parentIndex: pi, childIndex: null, isFirst: pi === 0, isLast: pi === state.length - 1 })
      // Children
      for (let ci = 0; ci < col.children.length; ci++) {
        items.push({ col: col.children[ci]!, isGroup: false, parentIndex: pi, childIndex: ci, isFirst: ci === 0, isLast: ci === col.children.length - 1 })
      }
    } else {
      // Standalone leaf
      items.push({ col, isGroup: false, parentIndex: pi, childIndex: null, isFirst: pi === 0, isLast: pi === state.length - 1 })
    }
  }
  return items
})

function onColumnManagerMoveUp(item: ColumnManagerItem) {
  if (item.childIndex !== null) {
    // Child within group
    columns.reorderChildren(item.parentIndex, item.childIndex, item.childIndex - 1)
  } else {
    // Top-level (standalone or group)
    columns.reorderTopLevel(item.parentIndex, item.parentIndex - 1)
  }
}

function onColumnManagerMoveDown(item: ColumnManagerItem) {
  if (item.childIndex !== null) {
    // Child within group
    columns.reorderChildren(item.parentIndex, item.childIndex, item.childIndex + 1)
  } else {
    // Top-level (standalone or group)
    columns.reorderTopLevel(item.parentIndex, item.parentIndex + 1)
  }
}

// Column manager drag-and-drop
const cmDragSource = ref<{ parentIndex: number, childIndex: number | null } | null>(null)
const cmDropTarget = ref<{ parentIndex: number, childIndex: number | null, position: 'before' | 'after' } | null>(null)

function isCmDropValid(target: ColumnManagerItem): boolean {
  const src = cmDragSource.value
  if (!src) return false
  // Both children in same group
  if (src.childIndex !== null && target.childIndex !== null) return src.parentIndex === target.parentIndex
  // Both top-level (group or standalone)
  if (src.childIndex === null && target.childIndex === null) return true
  return false
}

function onCmDragStart(item: ColumnManagerItem, e: DragEvent) {
  cmDragSource.value = { parentIndex: item.parentIndex, childIndex: item.childIndex }
  e.dataTransfer!.effectAllowed = 'move'
}

function onCmDragOver(item: ColumnManagerItem, e: DragEvent) {
  if (!isCmDropValid(item)) return
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'move'
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const position: 'before' | 'after' = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
  cmDropTarget.value = { parentIndex: item.parentIndex, childIndex: item.childIndex, position }
}

function onCmDragLeave(e: DragEvent) {
  const el = e.currentTarget as HTMLElement
  if (!el.contains(e.relatedTarget as Node)) cmDropTarget.value = null
}

function onCmDrop() {
  const src = cmDragSource.value
  const tgt = cmDropTarget.value
  if (!src || !tgt) return

  if (src.childIndex !== null && tgt.childIndex !== null) {
    let to = tgt.position === 'before' ? tgt.childIndex : tgt.childIndex + 1
    if (src.childIndex < to) to--
    if (src.childIndex !== to) columns.reorderChildren(src.parentIndex, src.childIndex, to)
  } else {
    let to = tgt.position === 'before' ? tgt.parentIndex : tgt.parentIndex + 1
    if (src.parentIndex < to) to--
    if (src.parentIndex !== to) columns.reorderTopLevel(src.parentIndex, to)
  }

  cmDragSource.value = null
  cmDropTarget.value = null
}

function onCmDragEnd() {
  cmDragSource.value = null
  cmDropTarget.value = null
}

function cmDragClasses(item: ColumnManagerItem): Record<string, boolean> {
  const src = cmDragSource.value
  const tgt = cmDropTarget.value
  const isSource = !!src && src.parentIndex === item.parentIndex && src.childIndex === item.childIndex
  const isGroupChild = !!src && src.childIndex === null && item.childIndex !== null && src.parentIndex === item.parentIndex
  return {
    'cm-drag-source': isSource || isGroupChild,
    'cm-drop-before': !!tgt && tgt.parentIndex === item.parentIndex && tgt.childIndex === item.childIndex && tgt.position === 'before',
    'cm-drop-after': !!tgt && tgt.parentIndex === item.parentIndex && tgt.childIndex === item.childIndex && tgt.position === 'after'
  }
}

const selection = useTableSelection({
  selectable: selectableRef,
  selectionMode: selectionModeRef,
  emit: selected => emit('selection-change', selected)
})

// Alias for v-model:selection binding (v-model needs a ref, not .value)
const selectedRowsModel = selection.selectedRows

const edit = useTableEdit({
  editable: editableRef,
  editableColumns: editableColumnsRef,
  columnState: columns.columnState,
  visibleColumns: columns.visibleColumns,
  rows: rowsRef,
  displayedRows: pagination.displayedRows,
  cellConfig: cellConfigRef,
  dataTableRef,
  emit: {
    editSave: payload => emit('row-edit-save', payload)
  },
  getBodyRowSpan: span.getBodyRowSpan,
  getMergeGroupIndices: span.getMergeGroupIndices
})

const validation = useTableValidation({
  rows: rowsRef,
  displayedRows: pagination.displayedRows,
  columnState: columns.columnState,
  visibleColumns: columns.visibleColumns,
  cellConfig: cellConfigRef,
  editable: editableRef,
  editableColumns: editableColumnsRef
})

const procFlag = useTableProcFlag({
  rows: rowsRef,
  dirtyRows: edit.dirtyRows
})

function onCellEditCompleteWithValidation(event: any) {
  edit.onCellEditComplete(event)
  const { data, field } = event
  validation.validateCell(data, field)
}

function onInlineToggleWithValidation(row: any, field: string, val: any) {
  edit.onInlineToggle(row, field, val)
  validation.validateCell(row, field)
}

function insertRow(defaultValues?: Partial<any>): any {
  const blank: any = {}
  for (const col of columns.columnState) {
    if (col.field) blank[col.field] = null
  }
  const key = generateTempKey()
  blank[ROW_ID] = key
  blank.procFlag = 'I'
  if (defaultValues) {
    Object.assign(blank, defaultValues)
    // Ensure ROW_ID and procFlag are not overwritten by defaultValues
    blank[ROW_ID] = key
    blank.procFlag = 'I'
  }
  rowsRef.value.unshift(blank)
  triggerRef(rowsRef)
  procFlag.markInsert(key)
  return blank
}

function insertRows(rowDefaults: Partial<any>[]): any[] {
  return rowDefaults.map(defaults => insertRow(defaults))
}

function deleteRow(key: string | number): void {
  procFlag.markDelete(key)
}

function deleteRows(keys: (string | number)[]): void {
  for (const key of keys) {
    procFlag.markDelete(key)
  }
}

function deleteSelected(): void {
  const keys = selection.selectedRows.value.map((r: any) => r[ROW_ID])
  for (const key of keys) {
    procFlag.markDelete(key)
  }
  selection.clearSelection()
}

function getRow(key: string | number): any | undefined {
  return procFlag.getRowByKey(key).map((r:any) => {
    const copy = { ...r }
    delete copy[ROW_ID]
    return copy
  })[0]
}

function getRows(flags?: ProcFlag[]): any[] {
  return procFlag.getRowsByFlag(flags).map(r => {
    const copy = { ...r }
    delete copy[ROW_ID]
    return copy
  })
}

function getSelectedRows(): any[] {
  return selection.selectedRows.value;
}

function hasChanges(): boolean {
  return procFlag.hasChanges()
}

function clearChanges(): void {
  procFlag.clearProcFlags()
  edit.clearDirty()
  validation.clearErrors()
}

function hasSelectedRow(): boolean {
  return selection.hasSelection.value;
}

function resetTable(): void {
  columns.resetColumns()
  sort.clearSort()
  selection.clearSelection()
  procFlag.clearProcFlags()
  edit.clearDirty()
  validation.clearErrors()
}

const footer = useTableFooter({
  rows: rowsRef,
  visibleColumns: columns.visibleColumns,
  footerAggregations: footerAggregationsRef,
  showFooter: showFooterRef
})

const exportTable = useTableExport({
  rows: rowsRef,
  displayedRows: pagination.displayedRows,
  selectedRows: selection.selectedRows,
  visibleColumns: columns.visibleColumns,
  exportFilename: exportFilenameRef
})

const { confirmAsync } = useAppDialog()

const menus = useTableMenus({
  editable: editableRef,
  headerContextMenu: headerContextMenuRef,
  rowContextMenu: rowContextMenuRef,
  columns,
  sort,
  selection,
  exportFn: exportTable,
  rows: rowsRef,
  emit: {
    editSave: payload => emit('row-edit-save', payload),
    refresh: () => emit('refresh'),
    fullScreenChange: val => emit('full-screen-change', val)
  },
  rootRef,
  confirmAsync,
  procFlag: {
    markInsert: procFlag.markInsert,
    markDelete: procFlag.markDelete,
    getFlag: procFlag.getFlag
  },
  generateTempKey,
  columnState: columns.columnState,
  resetTable
})

// Computed scroll height from tableHeight offset
const computedScrollHeight = computed(() => {
  if (props.tableHeight != null) return `calc(100vh - ${props.tableHeight}px)`
  if (virtualScrollRef.value) return props.scrollHeight
  return undefined
})

// Virtual scroll options
const virtualScrollerOptions = computed(() => {
  if (!virtualScrollRef.value) return undefined
  return { itemSize: props.virtualRowHeight }
})

// Scroll to top
function scrollToTop() {
  dataTableRef.value?.virtualScroller?.scrollToIndex(0)
}

// On sort change, scroll to top
watch([sort.sortField, sort.multiSortMeta], () => {
  if (virtualScrollRef.value) {
    nextTick(() => scrollToTop())
  }
})

// Infinite scroll lifecycle
onMounted(() => {
  pagination.setupInfiniteScroll()
})
onUnmounted(() => {
  pagination.teardownInfiniteScroll()
})

// Fullscreen class
const isFullscreen = ref(false)
function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}
onMounted(() => document.addEventListener('fullscreenchange', onFullscreenChange))
onUnmounted(() => document.removeEventListener('fullscreenchange', onFullscreenChange))

// Expose API
defineExpose({
  // Existing
  exportTable: exportTable.exportTable,
  scrollToTop,
  resetColumns: columns.resetColumns,
  clearSelection: selection.clearSelection,
  clearSort: sort.clearSort,
  clearDirty: edit.clearDirty,
  resetTable,
  getDirtyRows: edit.getDirtyRows,
  refresh: () => emit('refresh'),
  // procFlag API
  insertRow,
  insertRows,
  deleteRow,
  deleteRows,
  deleteSelected,
  getRow,
  getRows,
  getSelectedRows,
  hasSelectedRow,
  hasChanges,
  clearChanges,
  getFlag: procFlag.getFlag,
  // Validation API
  validate: validation.validate,
  getErrors: validation.getErrors,
  getCellErrors: validation.getCellErrors,
  clearErrors: validation.clearErrors,
  isValid: validation.isValid
})
</script>

<template>
  <div
    ref="rootRef"
    class="app-data-table"
    :class="{ 'is-fullscreen': isFullscreen }"
    @keydown="edit.handleKeyDown"
  >
    <!-- Toolbar slot -->
    <div
      v-if="$slots.toolbar"
      class="mb-1.5 flex items-center gap-2 flex-wrap"
    >
      <slot name="toolbar" />
    </div>

    <!-- Loading overlay for refresh -->
    <div class="relative">
      <div
        v-if="menus.isRefreshing.value"
        class="absolute inset-0 z-10 flex items-center justify-center bg-surface-0/50 dark:bg-surface-900/50"
      >
        <PProgressSpinner style="width: 2rem; height: 2rem" />
      </div>

      <PDataTable
        ref="dataTableRef"
        v-model:selection="selectedRowsModel"
        :value="loading ? [] : pagination.displayedRows.value"
        :data-key="ROW_ID"
        :loading="false"
        :show-gridlines="showGridlines"
        :striped-rows="stripedRows"
        :resizable-columns="resizableColumns"
        column-resize-mode="expand"
        :reorderable-columns="reorderableColumns && !span.hasColumnGroups.value"
        :scroll-height="computedScrollHeight"
        :scrollable="!!computedScrollHeight || stickyHeader"
        :virtual-scroller-options="virtualScrollerOptions"
        :sort-field="sort.sortField.value"
        :sort-order="sort.sortOrder.value"
        :multi-sort-meta="sort.multiSortMeta.value"
        sort-mode="multiple"
        :removable-sort="true"
        :selection-mode="selectable ? (selectionMode === 'checkbox' ? undefined : selectionMode) : undefined"
        :edit-mode="editable ? 'cell' : undefined"
        :lazy="paginationMode === 'server'"
        @sort="sort.onSort"

        @column-resize-end="() => columns.onColumnResizeEnd(dataTableRef)"
        @cell-edit-init="edit.onCellEditInit"
        @cell-edit-complete="onCellEditCompleteWithValidation"
        @row-contextmenu="menus.onRowContextMenu"
      >
        <!-- Skeleton loading -->
        <template v-if="loading" #empty>
          <div class="flex flex-col">
            <div
              v-for="r in pageSize"
              :key="r"
              class="flex gap-2 py-2 px-3"
            >
              <PSkeleton
                v-if="selectable && selectionMode === 'checkbox'"
                width="1.25rem"
                height="1.25rem"
                class="shrink-0"
              />
              <PSkeleton
                v-for="col in bodyColumns"
                :key="col.field!"
                height="1rem"
                class="flex-1"
              />
            </div>
          </div>
        </template>

        <!-- Empty slot -->
        <template v-else #empty>
          <slot name="empty">
            <div class="text-center py-8 text-surface-400">
              {{ $t('table.noData') }}
            </div>
          </slot>
        </template>

        <!-- === Grouped header mode (PColumnGroup) === -->
        <template v-if="span.hasColumnGroups.value">
          <PColumnGroup type="header">
            <PRow
              v-for="(hRow, ri) in span.headerRows.value"
              :key="ri"
            >
              <PColumn
                v-if="selectable && selectionMode === 'checkbox' && ri === 0"
                selection-mode="multiple"
                :rowspan="span.headerRows.value.length"
                :frozen="true"
                :style="{ width: '50px' }"
              />
              <PColumn
                v-for="(cell, ci) in hRow"
                :key="ci"
                :colspan="cell.colspan > 1 ? cell.colspan : undefined"
                :rowspan="cell.rowspan > 1 ? cell.rowspan : undefined"
                :sortable="cell.col ? cell.col.sortable !== false : false"
                :field="cell.field"
                :frozen="cell.col?.frozen"
                :style="{
                  ...(cell.col ? {
                    width: (cell.col.width ?? defaultColumnWidth) + 'px',
                    minWidth: (cell.col.minWidth ?? 80) + 'px',
                    textAlign: cell.col.align ?? 'left'
                  } : { textAlign: 'center' }),
                  ...(cell.col?.frozen ? { borderRight: '0.5px solid var(--p-datatable-body-cell-border-color)' } : {})
                }"
              >
                <template #header>
                  <div
                    v-bind="columnDrag.getDragAttrs(cell, ri)"
                    class="grouped-header-cell flex items-center gap-1 w-full font-bold"
                    :class="{
                      'column-drag-over-left': columnDrag.dragOverGroupIndex.value !== null
                        && resolveHeaderCellGroup(cell) === columnDrag.dragOverGroupIndex.value
                        && columnDrag.dragDirection.value === 'left',
                      'column-drag-over-right': columnDrag.dragOverGroupIndex.value !== null
                        && resolveHeaderCellGroup(cell) === columnDrag.dragOverGroupIndex.value
                        && columnDrag.dragDirection.value === 'right'
                    }"
                    :style="columnDrag.isActive.value && !cell.col?.frozen ? { cursor: 'grab' } : {}"
                    @contextmenu.prevent="cell.col ? menus.onHeaderContextMenu($event, cell.col) : undefined"
                  >
                    <slot
                      :name="cell.field ? `header-${cell.field}` : undefined"
                      :column="cell.col"
                    >
                      {{ cell.header }}
                      <span v-if="cell.col?.validators?.required" class="text-red-500 ml-0.5">*</span>
                    </slot>
                  </div>
                </template>
              </PColumn>
            </PRow>
          </PColumnGroup>
        </template>

        <!-- === Flat header mode (default -- checkbox column) === -->
        <PColumn
          v-if="!span.hasColumnGroups.value && selectable && selectionMode === 'checkbox'"
          selection-mode="multiple"
          :frozen="true"
          :style="{ width: '50px' }"
        />

        <!-- Data columns (uses bodyColumns for both modes) -->
        <PColumn
          v-for="col in bodyColumns"
          :key="col.field!"
          :field="col.field"
          :sortable="!span.hasColumnGroups.value ? col.sortable !== false : false"
          :frozen="col.frozen"
          :style="{
            width: (col.width ?? defaultColumnWidth) + 'px',
            minWidth: (col.minWidth ?? 80) + 'px',
            textAlign: col.align ?? 'left',
            ...(col.frozen ? { borderRight: '0.5px solid var(--p-datatable-body-cell-border-color)' } : {})
          }"
        >
          <!-- Header (flat mode only -- grouped mode uses PColumnGroup above) -->
          <template
            v-if="!span.hasColumnGroups.value"
            #header
          >
            <div
              class="flex items-center gap-1 w-full font-bold"
              @contextmenu.prevent="menus.onHeaderContextMenu($event, col)"
            >
              <slot
                :name="`header-${col.field}`"
                :column="col"
              >
                {{ col.header }}
                <span v-if="col.validators?.required" class="text-red-500 ml-0.5">*</span>
              </slot>
            </div>
          </template>

          <!-- Body -->
          <template #body="{ data, index }">
            <div
              v-row-span="col.rowSpan ? span.getBodyRowSpan(data, col.field!, index) : 1"
              v-tooltip.top="validation.hasError(data, col.field!) ? validation.getCellErrors(data, col.field!).join('\n') : undefined"
              :data-field="col.field"
              class="cell-content"
              :class="{ 'cell-invalid': validation.hasError(data, col.field!) }"
            >
              <slot
                :name="`body-${col.field}`"
                :data="data"
                :column="col"
                :index="index"
              >
                <template v-if="(col.editType === 'checkbox' || col.editType === 'toggle') && editable && edit.isCellEditable(data, col.field!)">
                  <div
                    class="flex items-center justify-center"
                    :class="{ 'opacity-50': edit.isCellDisabled(data, col.field!) }"
                  >
                    <PCheckbox
                      v-if="col.editType === 'checkbox'"
                      :model-value="data[col.field!]"
                      :binary="true"
                      :disabled="edit.isCellDisabled(data, col.field!)"
                      v-bind="col.editProps"
                      @update:model-value="(val: any) => onInlineToggleWithValidation(data, col.field!, val)"
                    />
                    <PToggleSwitch
                      v-else
                      :model-value="data[col.field!]"
                      :disabled="edit.isCellDisabled(data, col.field!)"
                      v-bind="col.editProps"
                      @update:model-value="(val: any) => onInlineToggleWithValidation(data, col.field!, val)"
                    />
                  </div>
                </template>
                <template v-else-if="col.editType === 'checkbox' || col.editType === 'toggle'">
                  <div
                    class="flex items-center justify-center"
                    :class="{ 'opacity-50': edit.isCellDisabled(data, col.field!) }"
                  >
                    <i
                      class="pi text-sm"
                      :class="(col.editProps?.trueValue !== undefined ? data[col.field!] === col.editProps.trueValue : data[col.field!]) ? 'pi-check-circle text-green-500' : 'pi-times-circle text-surface-400'"
                    />
                  </div>
                </template>
                <span
                  v-else
                  class="cell-text"
                  :class="{ 'opacity-50': edit.isCellDisabled(data, col.field!) }"
                >
                  <component
                    :is="() => col.render!(data[col.field!], data, col)"
                    v-if="col.render"
                  />
                  <template v-else>{{ edit.getCellDisplayValue(data[col.field!], data, col) }}</template>
                </span>
              </slot>
            </div>
          </template>

          <!-- Cell editor (skip checkbox/toggle — they render inline in body) -->
          <template
            v-if="editable && col.editType !== 'checkbox' && col.editType !== 'toggle'"
            #editor="{ data, field, index }"
          >
            <div
              :data-field="field"
              class="cell-editor"
              @keydown.tab.prevent.stop="edit.handleKeyDown($event)"
            >
              <template v-if="edit.isCellEditable(data, field) && !edit.isCellDisabled(data, field)">
                <TableCellEditor
                  :value="data[field]"
                  :field="field"
                  :row="data"
                  :col-def="col"
                  :options="edit.getCellOptions(data, col)"
                  @update:value="(val: any) => { data[field] = val; edit.onEditorValueChange(field, val) }"
                />
              </template>
              <template v-else>
                <span
                  class="cell-text"
                  :class="{ 'opacity-50': edit.isCellDisabled(data, field) }"
                >
                  <component
                    :is="() => col.render!(data[field], data, col)"
                    v-if="col.render"
                  />
                  <template v-else>{{ edit.getCellDisplayValue(data[field], data, col) }}</template>
                </span>
              </template>
            </div>
          </template>

          <!-- Footer -->
          <template
            v-if="showFooter"
            #footer
          >
            <slot
              :name="`footer-${col.field}`"
              :column="col"
              :value="footer.footerValues.value[col.field!]"
              :rows="rows"
            >
              <template v-if="footer.footerValues.value[col.field!]">
                <span
                  class="font-semibold"
                  :class="{ 'text-right block': col.align === 'right' || ['number'].includes(col.editType ?? '') }"
                >
                  {{ footer?.footerValues?.value[col.field!]?.formatted }}
                </span>
              </template>
              <template v-else-if="footer.firstNonAggColumn.value === col.field">
                <span class="font-semibold">{{ $t('table.totals') }}</span>
              </template>
            </slot>
          </template>
        </PColumn>
      </PDataTable>
    </div>

    <!-- Infinite scroll sentinel -->
    <div
      v-if="dataMode === 'infiniteScroll'"
      :ref="(el: any) => { pagination.sentinelRef.value = el }"
      class="flex justify-center py-4"
    >
      <PProgressSpinner
        v-if="pagination.isLoadingMore.value"
        style="width: 2rem; height: 2rem"
      />
    </div>

    <!-- Paginator with total rows display -->
    <div
      v-if="pagination.showPaginator.value"
      class="flex items-center justify-between gap-4 mt-2 min-h-8"
    >
      <!-- Paginator in center -->
      <div class="flex-1 flex justify-center">
        <PPaginator
          :first="pagination.first.value"
          :rows="pagination.currentPageSize.value"
          :total-records="pagination.totalCount.value"
          :rows-per-page-options="pageSizeOptions"
          class="app-paginator-compact"
          @page="pagination.onPageChange"
        />
      </div>
      <!-- Total rows display (fixed on right) -->
      <span class="text-xs text-surface-600 dark:text-surface-400 whitespace-nowrap mr-1.25">
        Total: {{ pagination.totalCount.value }} row(s)
      </span>
    </div>

    <!-- Context menus -->
    <PContextMenu
      :ref="(el: any) => { menus.headerMenuRef.value = el }"
      :model="menus.headerMenuModel.value"
      :global="false"
    />
    <PContextMenu
      :ref="(el: any) => { menus.rowMenuRef.value = el }"
      :model="menus.rowMenuModel.value"
      :global="false"
    />

    <!-- Column Manager Dialog -->
    <PDialog
      v-model:visible="menus.showColumnManager.value"
      :header="$t('table.showHideColumns')"
      modal
      :style="{ width: '360px' }"
      :draggable="false"
      :content-style="{ overflow: 'auto', maxHeight: '60vh', paddingBottom: 0 }"
    >
      <div class="flex flex-col gap-1">
        <template
          v-for="(item, idx) in columnManagerItems"
          :key="item.col.field ?? `group-${item.parentIndex}`"
        >
          <!-- Group header row -->
          <div
            v-if="item.isGroup"
            class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800 mt-1 cursor-grab"
            :class="cmDragClasses(item)"
            draggable="true"
            @dragstart="onCmDragStart(item, $event)"
            @dragover="onCmDragOver(item, $event)"
            @dragleave="onCmDragLeave"
            @drop.prevent="onCmDrop"
            @dragend="onCmDragEnd"
          >
            <span class="flex-1 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide">{{ item.col.header }}</span>
            <button
              class="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-30 disabled:cursor-default"
              :disabled="item.isFirst"
              @click="onColumnManagerMoveUp(item)"
            >
              <i class="pi pi-chevron-up text-xs" />
            </button>
            <button
              class="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-30 disabled:cursor-default"
              :disabled="item.isLast"
              @click="onColumnManagerMoveDown(item)"
            >
              <i class="pi pi-chevron-down text-xs" />
            </button>
          </div>
          <!-- Leaf column row -->
          <div
            v-else
            class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800 cursor-grab"
            :class="[{ 'ml-4': item.childIndex !== null }, cmDragClasses(item)]"
            draggable="true"
            @dragstart="onCmDragStart(item, $event)"
            @dragover="onCmDragOver(item, $event)"
            @dragleave="onCmDragLeave"
            @drop.prevent="onCmDrop"
            @dragend="onCmDragEnd"
          >
            <PCheckbox
              :model-value="!item.col.hidden"
              :binary="true"
              @update:model-value="() => columns.toggleColumnVisibility(item.col.field!)"
            />
            <span class="flex-1 text-sm truncate">{{ item.col.header }}</span>
            <button
              class="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-30 disabled:cursor-default"
              :disabled="item.isFirst"
              @click="onColumnManagerMoveUp(item)"
            >
              <i class="pi pi-chevron-up text-xs" />
            </button>
            <button
              class="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-30 disabled:cursor-default"
              :disabled="item.isLast"
              @click="onColumnManagerMoveDown(item)"
            >
              <i class="pi pi-chevron-down text-xs" />
            </button>
          </div>
        </template>
      </div>
      <template #footer>
        <div class="flex gap-2">
          <PButton
            :label="$t('table.showAllColumns')"
            icon="pi pi-eye"
            severity="secondary"
            size="small"
            @click="columns.showAllColumns()"
          />
          <PButton
            :label="$t('table.resetToDefault')"
            icon="pi pi-refresh"
            severity="secondary"
            size="small"
            @click="columns.resetColumns()"
          />
        </div>
      </template>
    </PDialog>
  </div>
</template>

<style scoped>
.app-data-table.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  overflow: auto;
  background: var(--p-surface-0);
}

:deep(.p-checkbox) {
  height: 1.25rem !important;
  width: 1.25rem !important;
}

:deep(td) {
  padding: 0px;
}

:deep(.dark) .app-data-table.is-fullscreen {
  background: var(--p-surface-900);
}

/* Dense enterprise cell padding */
:deep(.p-datatable-tbody > tr > td) {
  padding: 0.25rem 0.5rem;
}
:deep(.p-datatable-thead > tr > th) {
  padding: 0.3rem 0.5rem;
}

/*
 * Z-index layering for frozen columns + sticky header/footer.
 *
 * PrimeVue defaults (scrollable table):
 *   thead/tfoot: position:sticky, z-index:1
 *   frozen th:   position:sticky, z-index:1
 *   frozen td:   position:sticky, z-index:auto, background:inherit
 *
 * Problem: frozen td with z-index >= thead's z-index overlaps header
 * (equal z-index → DOM order wins → tbody paints over thead).
 *
 * Solution: bump thead/tfoot to z-2 at the element level.
 * Frozen cells use z-1 for horizontal scroll layering within their section.
 */

/* Sticky thead/tfoot: z-2 so entire header/footer sits above frozen body cells */
:deep(.p-datatable-scrollable-table > .p-datatable-thead) {
  z-index: 2 !important;
}

:deep(.p-datatable-scrollable-table > .p-datatable-tfoot) {
  z-index: 2 !important;
}

/* Frozen body cells: opaque + z-1 (above non-frozen siblings on horizontal scroll) */
:deep(.p-datatable-tbody > tr > td.p-datatable-frozen-column) {
  background: var(--p-datatable-row-background);
  z-index: 1 !important;
}

/* Frozen header cells: opaque + z-1 within thead stacking context (horizontal scroll) */
:deep(.p-datatable-thead > tr > th.p-datatable-frozen-column) {
  background: var(--p-datatable-header-cell-background);
}

/* Frozen footer cells: opaque + z-1 within tfoot stacking context */
:deep(.p-datatable-tfoot > tr > td.p-datatable-frozen-column) {
  background: var(--p-datatable-footer-cell-background);
}

/* Frozen column right border for visual separation */
:deep(th.p-datatable-frozen-column),
:deep(td.p-datatable-frozen-column) {
  border-right: 0.5px solid var(--p-datatable-body-cell-border-color);
}

/* Force cells to respect column width and truncate overflow */
:deep(.p-datatable-tbody > tr > td) {
  max-width: 0;
}

.cell-content {
  overflow: hidden;
  min-height: 1.25rem;
}

.cell-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Remove td padding when cell editor is active */
:deep(td[data-p-cell-editing='true']) {
  padding: 0px !important;
}

/* Editor container: constrain width so inputs don't overflow */
.cell-editor {
  overflow: hidden;
  min-width: 0;
}

/* Truncate text inside editor inputs */
:deep(.cell-editor input) {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Cell editor Select / MultiSelect: compact size */
:deep(.cell-editor .p-select),
:deep(.cell-editor .p-multiselect) {
  font-size: 0.85rem;
}

:deep(.cell-editor .p-select .p-select-label),
:deep(.cell-editor .p-multiselect .p-multiselect-label) {
  font-size: 0.85rem;
  padding: 0.25rem 0.375rem;
}

:deep(.cell-editor .p-select .p-select-dropdown),
:deep(.cell-editor .p-multiselect .p-multiselect-dropdown) {
  width: 1.25rem;
}

:deep(.cell-editor .p-select .p-select-dropdown .p-icon),
:deep(.cell-editor .p-multiselect .p-multiselect-dropdown .p-icon) {
  width: 0.625rem;
  height: 0.625rem;
}

:deep(.cell-editor .p-select .p-select-clear-icon),
:deep(.cell-editor .p-multiselect .p-multiselect-clear-icon) {
  width: 0.625rem;
  height: 0.625rem;
}

/* InputNumber: make wrapper fill cell, input truncate on overflow */
:deep(.cell-editor .p-inputnumber) {
  width: 100%;
}
:deep(.cell-editor .p-inputnumber .p-inputtext) {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Compact paginator styling */
:deep(.p-paginator) {
  padding: 0 !important;
  gap: 0.25rem;
  font-size: 0.75rem;
  background-color: transparent !important;
}

:deep(.p-paginator .p-paginator-content) {
  gap: 0.25rem;
}

:deep(.p-paginator .p-paginator-current) {
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
}

/* Rows-per-page Select */
:deep(.p-paginator .p-paginator-rpp-dropdown) {
  font-size: 0.75rem;
  height: 1.625rem;
}

:deep(.p-paginator .p-paginator-rpp-dropdown .p-select-label) {
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  line-height: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.p-paginator .p-paginator-rpp-dropdown .p-select-dropdown) {
  width: 1.375rem;
}

:deep(.p-paginator .p-paginator-rpp-dropdown .p-select-dropdown .p-icon) {
  width: 0.65rem;
  height: 0.65rem;
}

/* Navigation buttons */
:deep(.p-paginator .p-paginator-pages) {
  gap: 0.125rem;
}

:deep(.p-paginator .p-paginator-page),
:deep(.p-paginator .p-paginator-next),
:deep(.p-paginator .p-paginator-prev),
:deep(.p-paginator .p-paginator-first),
:deep(.p-paginator .p-paginator-last) {
  font-size: 0.75rem;
  min-width: 1.625rem;
  height: 1.625rem;
  padding: 0;
}

:deep(.p-paginator .p-paginator-first .p-icon),
:deep(.p-paginator .p-paginator-prev .p-icon),
:deep(.p-paginator .p-paginator-next .p-icon),
:deep(.p-paginator .p-paginator-last .p-icon) {
  width: 0.65rem;
  height: 0.65rem;
}

/* Merged rowSpan cells: vertical alignment */
:deep(td[rowspan]) {
  vertical-align: middle;
}

/* Column drag-and-drop visual feedback (on .grouped-header-cell div inside th) */
.grouped-header-cell.column-drag-source {
  opacity: 0.4;
}

.grouped-header-cell.column-drag-over-left {
  border-left: 2.5px solid var(--p-primary-color);
}

.grouped-header-cell.column-drag-over-right {
  border-right: 2.5px solid var(--p-primary-color);
}

/* Column manager DnD feedback */
.cm-drag-source {
  opacity: 0.4;
}

.cm-drop-before {
  box-shadow: 0 -2px 0 0 var(--p-primary-color);
}

.cm-drop-after {
  box-shadow: 0 2px 0 0 var(--p-primary-color);
}

/* Validation error — red outline on td (body mode only, not during edit) */
:deep(td:has(.cell-invalid)) {
  outline: 2px solid var(--p-red-400);
  outline-offset: -2px;
}

/* Smaller tooltip text for validation errors */
:deep(.p-tooltip .p-tooltip-text) {
  font-size: 0.7rem;
  line-height: 1.3;
}

/* ==================== Tablet ==================== */
@media (min-width: 640px) and (max-width: 1023px) {
  /* Cell padding + font */
  :deep(.p-datatable-tbody > tr > td),
  :deep(.p-datatable-thead > tr > th) {
    padding: 0.25rem 0.375rem;
    font-size: 0.75rem;
  }

  /* Header text truncation */
  :deep(.p-datatable-thead > tr > th) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Footer */
  :deep(.p-datatable-tfoot > tr > td) {
    padding: 0.25rem 0.375rem;
    font-size: 0.75rem;
  }

  /* Header sort icon + badge */
  :deep(.p-datatable-sort-icon) {
    width: 0.7rem;
    height: 0.7rem;
  }
  :deep(.p-datatable-sort-badge) {
    font-size: 0.5rem;
    min-width: 0.875rem;
    height: 0.875rem;
  }

  /* Cell editors */
  :deep(.cell-editor .p-select),
  :deep(.cell-editor .p-multiselect) {
    font-size: 0.75rem;
  }
  :deep(.cell-editor .p-select .p-select-label),
  :deep(.cell-editor .p-multiselect .p-multiselect-label) {
    font-size: 0.75rem;
    padding: 0.125rem 0.1875rem;
  }
  :deep(.cell-editor .p-select .p-select-dropdown),
  :deep(.cell-editor .p-multiselect .p-multiselect-dropdown) {
    width: 1rem;
  }
  :deep(.cell-editor .p-select .p-select-dropdown .p-icon),
  :deep(.cell-editor .p-multiselect .p-multiselect-dropdown .p-icon) {
    width: 0.5rem;
    height: 0.5rem;
  }
  :deep(.cell-editor .p-select .p-select-clear-icon),
  :deep(.cell-editor .p-multiselect .p-multiselect-clear-icon) {
    width: 0.5rem;
    height: 0.5rem;
  }

  /* Paginator */
  :deep(.p-paginator) {
    gap: 0.1875rem;
    font-size: 0.6875rem;
  }
  :deep(.p-paginator .p-paginator-content) {
    gap: 0.1875rem;
  }
  :deep(.p-paginator .p-paginator-current) {
    font-size: 0.6875rem;
  }
  :deep(.p-paginator .p-paginator-rpp-dropdown) {
    font-size: 0.6875rem;
    height: 1.5rem;
  }
  :deep(.p-paginator .p-paginator-rpp-dropdown .p-select-label) {
    font-size: 0.6875rem;
  }
  :deep(.p-paginator .p-paginator-rpp-dropdown .p-select-dropdown .p-icon) {
    width: 0.55rem;
    height: 0.55rem;
  }
  :deep(.p-paginator .p-paginator-page),
  :deep(.p-paginator .p-paginator-next),
  :deep(.p-paginator .p-paginator-prev),
  :deep(.p-paginator .p-paginator-first),
  :deep(.p-paginator .p-paginator-last) {
    font-size: 0.6875rem;
    min-width: 1.5rem;
    height: 1.5rem;
  }
  :deep(.p-paginator .p-paginator-first .p-icon),
  :deep(.p-paginator .p-paginator-prev .p-icon),
  :deep(.p-paginator .p-paginator-next .p-icon),
  :deep(.p-paginator .p-paginator-last .p-icon) {
    width: 0.55rem;
    height: 0.55rem;
  }
}

/* ==================== Mobile ==================== */
@media (max-width: 639px) {
  /* Cell padding + font */
  :deep(.p-datatable-tbody > tr > td),
  :deep(.p-datatable-thead > tr > th) {
    padding: 0.1875rem 0.25rem;
    font-size: 0.6875rem;
  }

  /* Header text truncation */
  :deep(.p-datatable-thead > tr > th) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Header sort icon + badge */
  :deep(.p-datatable-sort-icon) {
    width: 0.5625rem;
    height: 0.5625rem;
  }
  :deep(.p-datatable-sort-badge) {
    font-size: 0.4375rem;
    min-width: 0.75rem;
    height: 0.75rem;
  }

  /* Footer */
  :deep(.p-datatable-tfoot > tr > td) {
    padding: 0.1875rem 0.25rem;
    font-size: 0.6875rem;
  }

  /* Cell editors */
  :deep(.cell-editor .p-select),
  :deep(.cell-editor .p-multiselect) {
    font-size: 0.6875rem;
  }
  :deep(.cell-editor .p-select .p-select-label),
  :deep(.cell-editor .p-multiselect .p-multiselect-label) {
    font-size: 0.6875rem;
    padding: 0.0625rem 0.125rem;
  }
  :deep(.cell-editor .p-select .p-select-dropdown),
  :deep(.cell-editor .p-multiselect .p-multiselect-dropdown) {
    width: 0.875rem;
  }
  :deep(.cell-editor .p-select .p-select-dropdown .p-icon),
  :deep(.cell-editor .p-multiselect .p-multiselect-dropdown .p-icon) {
    width: 0.4375rem;
    height: 0.4375rem;
  }
  :deep(.cell-editor .p-select .p-select-clear-icon),
  :deep(.cell-editor .p-multiselect .p-multiselect-clear-icon) {
    width: 0.4375rem;
    height: 0.4375rem;
  }

  /* Checkbox — box + icon */
  :deep(.p-checkbox) {
    height: 0.875rem !important;
    width: 0.875rem !important;
  }
  :deep(.p-checkbox .p-checkbox-box) {
    width: 0.875rem;
    height: 0.875rem;
  }
  :deep(.p-checkbox .p-checkbox-icon) {
    font-size: 0.5rem;
  }
  :deep(.p-checkbox .p-checkbox-box .p-icon) {
    width: 0.5rem;
    height: 0.5rem;
  }

  /* Toggle switch — compact for mobile */
  :deep(.p-toggleswitch) {
    width: 2rem;
    height: 1rem;
  }
  :deep(.p-toggleswitch .p-toggleswitch-slider) {
    width: 2rem;
    height: 1rem;
  }
  :deep(.p-toggleswitch .p-toggleswitch-handle) {
    width: 0.75rem;
    height: 0.75rem;
    margin-top: -6px;
  }

  /* Paginator */
  :deep(.p-paginator) {
    gap: 0.125rem;
    font-size: 0.625rem;
  }
  :deep(.p-paginator .p-paginator-content) {
    gap: 0.125rem;
  }
  :deep(.p-paginator .p-paginator-current) {
    font-size: 0.625rem;
  }
  :deep(.p-paginator .p-paginator-rpp-dropdown) {
    font-size: 0.625rem;
    height: 1.5rem;
  }
  :deep(.p-paginator .p-paginator-rpp-dropdown .p-select-label) {
    font-size: 0.625rem;
  }
  :deep(.p-paginator .p-paginator-rpp-dropdown .p-select-dropdown .p-icon) {
    width: 0.5rem;
    height: 0.5rem;
  }
  :deep(.p-paginator .p-paginator-page),
  :deep(.p-paginator .p-paginator-next),
  :deep(.p-paginator .p-paginator-prev),
  :deep(.p-paginator .p-paginator-first),
  :deep(.p-paginator .p-paginator-last) {
    font-size: 0.625rem;
    min-width: 1.5rem;
    height: 1.5rem;
  }
  :deep(.p-paginator .p-paginator-first .p-icon),
  :deep(.p-paginator .p-paginator-prev .p-icon),
  :deep(.p-paginator .p-paginator-next .p-icon),
  :deep(.p-paginator .p-paginator-last .p-icon) {
    width: 0.625rem;
    height: 0.625rem;
  }

  /* Hide page numbers on mobile — keep only prev/next */
  :deep(.p-paginator .p-paginator-pages) {
    display: none;
  }
  :deep(.p-paginator .p-paginator-first),
  :deep(.p-paginator .p-paginator-last) {
    display: none;
  }
}
</style>
