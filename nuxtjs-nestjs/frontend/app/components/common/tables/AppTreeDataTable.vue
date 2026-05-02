<script setup lang="ts">
import type {
  ColumnDef,
  AppTreeDataTableProps,
  PageEvent,
  SortEvent,
  EditSaveEvent,
  ExportFormat,
  ProcFlag,
} from '~/types/tree-table'
import type { HeaderCell } from '~/composables/table/useTableSpan'
import {
  useTreeBuilder,
  useTreeTableColumns,
  useTreeTableSort,
  useTreeTablePagination,
  useTreeTableSelection,
  useTreeTableEdit,
  useTreeTableValidation,
  useTreeTableFooter,
  useTreeTableExport,
  useTreeTableMenus,
  useTreeTableProcFlag,
  useTreeTableColumnDrag,
} from '~/composables/tree-table'
import { generateTempKey } from '~/composables/tree-table/useTreeTableProcFlag'

const props = withDefaults(defineProps<AppTreeDataTableProps>(), {
  rowKey: 'id',
  parentKey: 'parentId',
  pageSize: 25,
  pageSizeOptions: () => [10, 25, 50, 100],
  paginationMode: 'server',
  sortBackend: 'server',
  defaultSortOrder: 1,
  editable: false,
  selectable: false,
  selectionMode: 'multiple',
  showGridlines: true,
  resizableColumns: true,
  reorderableColumns: true,
  stickyHeader: true,
  maxFrozenColumns: 3,
  showFooter: false,
  rowContextMenu: true,
  headerContextMenu: true,
  defaultColumnWidth: 150,
  draggableRows: false,
  exportFilename: 'export',
  exportFormats: () => ['csv', 'xlsx'] as ExportFormat[],
  frozenColumns: () => [],
  footerAggregations: () => [],
  editableColumns: undefined,
})

const emit = defineEmits<{
  (e: 'page', payload: PageEvent): void
  (e: 'sort', payload: SortEvent): void
  (e: 'row-edit-save', payload: EditSaveEvent): void
  (e: 'full-screen-change', isFullscreen: boolean): void
  (e: 'selection-change', selected: any[]): void
  (e: 'refresh'): void
  (e: 'node-expand', node: any): void
  (e: 'node-collapse', node: any): void
  (e: 'node-reparent', payload: { nodeKey: string | number; newParentKey: string | number | null }): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const treeTableRef = ref<any>(null)

// Reactive prop refs for composables
const rowsRef = shallowRef(props.rows)
watch(() => props.rows, (val) => { rowsRef.value = val }, { flush: 'sync' })

const columnsRef = computed(() => props.columns)
const totalRecordsRef = computed(() => props.totalRecords)
const frozenColumnsRef = computed(() => props.frozenColumns)
const maxFrozenColumnsRef = computed(() => props.maxFrozenColumns)
const defaultColumnWidthRef = computed(() => props.defaultColumnWidth)
const sortBackendRef = computed(() => props.sortBackend)
const defaultSortFieldRef = computed(() => props.defaultSortField)
const defaultSortOrderRef = computed(() => props.defaultSortOrder)
const pageSizeRef = computed(() => props.pageSize)
const pageSizeOptionsRef = computed(() => props.pageSizeOptions)
const paginationModeRef = computed(() => props.paginationMode)
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
const treeBuilder = useTreeBuilder({
  rows: rowsRef,
  rowKey: props.rowKey,
  parentKey: props.parentKey,
})

const columns = useTreeTableColumns({
  columns: columnsRef,
  frozenColumns: frozenColumnsRef,
  maxFrozenColumns: maxFrozenColumnsRef,
  defaultColumnWidth: defaultColumnWidthRef,
})

const sort = useTreeTableSort({
  sortBackend: sortBackendRef,
  defaultSortField: defaultSortFieldRef,
  defaultSortOrder: defaultSortOrderRef,
  emit: (_, payload) => emit('sort', payload),
})

const pagination = useTreeTablePagination({
  paginationMode: paginationModeRef,
  pageSize: pageSizeRef,
  pageSizeOptions: pageSizeOptionsRef,
  rows: computed(() => treeBuilder.treeNodes.value.map(n => n.data)),
  totalRecords: totalRecordsRef,
  emit: {
    page: payload => emit('page', payload),
  },
})

// No column groups / span for tree table (keep stubs for columnDrag compatibility)
const hasColumnGroups = computed(() => false)
const headerRows = computed<HeaderCell[][]>(() => [])

const columnStateRef = computed(() => [...columns.columnState])

const columnDrag = useTreeTableColumnDrag({
  columns: columnStateRef,
  hasColumnGroups,
  headerRows,
  reorderableColumns: reorderableColumnsRef,
  columnsApi: columns,
})

const bodyColumns = computed(() => columns.visibleColumns.value)

const selection = useTreeTableSelection({
  selectable: selectableRef,
  selectionMode: selectionModeRef,
  rowKey: props.rowKey,
  rows: rowsRef,
  emit: selected => emit('selection-change', selected),
})

const selectionKeysModel = selection.selectionKeys

const edit = useTreeTableEdit({
  editable: editableRef,
  editableColumns: editableColumnsRef,
  columnState: columns.columnState,
  visibleColumns: columns.visibleColumns,
  rows: rowsRef,
  displayedRows: pagination.displayedRows,
  cellConfig: cellConfigRef,
  rowKey: props.rowKey,
  emit: {
    editSave: payload => emit('row-edit-save', payload),
  },
})

const validation = useTreeTableValidation({
  rows: rowsRef,
  displayedRows: pagination.displayedRows,
  columnState: columns.columnState,
  visibleColumns: columns.visibleColumns,
  cellConfig: cellConfigRef,
  editable: editableRef,
  editableColumns: editableColumnsRef,
  rowKey: props.rowKey,
})

const procFlag = useTreeTableProcFlag({
  rows: rowsRef,
  dirtyRows: edit.dirtyRows,
  rowKey: props.rowKey,
})

function onInlineToggleWithValidation(row: any, field: string, val: any) {
  edit.onInlineToggle(row, field, val)
  validation.validateCell(row, field)
}

function onCellClick(node: any, col: ColumnDef) {
  if (!props.editable) return
  if (!col.field) return
  if (col.editType === 'checkbox' || col.editType === 'toggle') return
  edit.startEdit(node.key, col.field)
}

/** Capture old value when starting edit, commit/cancel on Enter/Escape/blur */
function onEditorKeydown(e: KeyboardEvent, node: any, col: ColumnDef) {
  if (e.key === 'Enter') {
    e.preventDefault()
    const oldValue = node.data[col.field!]
    edit.commitEdit(node.key, col.field!, oldValue, node.data[col.field!])
  } else if (e.key === 'Escape') {
    e.preventDefault()
    edit.cancelEdit()
  }
}

function onEditorBlur(e: FocusEvent, node: any, col: ColumnDef) {
  // If blur target is inside the same editor cell, ignore
  const editorEl = (e.currentTarget as HTMLElement)
  if (editorEl?.contains(e.relatedTarget as Node)) return
  const oldValue = node.data[col.field!]
  edit.commitEdit(node.key, col.field!, oldValue, node.data[col.field!])
}

function insertRow(defaultValues?: Partial<any>): any {
  const blank: any = {}
  for (const col of columns.columnState) {
    if (col.field) blank[col.field] = null
  }
  const key = generateTempKey()
  blank[props.rowKey] = key
  blank.procFlag = 'I'
  if (defaultValues) {
    Object.assign(blank, defaultValues)
    blank[props.rowKey] = key
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
  const keys = selection.selectedRows.value.map((r: any) => r[props.rowKey])
  for (const key of keys) {
    procFlag.markDelete(key)
  }
  selection.clearSelection()
}

function getRow(key: string | number): any | undefined {
  return procFlag.getRowByKey(key)
}

function getRows(flags?: ProcFlag[]): any[] {
  return procFlag.getRowsByFlag(flags)
}

function getSelectedRows(): any[] {
  return selection.selectedRows.value
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
  return selection.hasSelection.value
}

function resetTable(): void {
  columns.resetColumns()
  sort.clearSort()
  selection.clearSelection()
  procFlag.clearProcFlags()
  edit.clearDirty()
  validation.clearErrors()
}

const footer = useTreeTableFooter({
  rows: rowsRef,
  visibleColumns: columns.visibleColumns,
  footerAggregations: footerAggregationsRef,
  showFooter: showFooterRef,
})

const exportTable = useTreeTableExport({
  rows: rowsRef,
  displayedRows: pagination.displayedRows,
  selectedRows: selection.selectedRows,
  visibleColumns: columns.visibleColumns,
  exportFilename: exportFilenameRef,
})

const { confirmAsync } = useAppDialog()

const menus = useTreeTableMenus({
  editable: editableRef,
  headerContextMenu: headerContextMenuRef,
  rowContextMenu: rowContextMenuRef,
  columns,
  sort,
  selection,
  exportFn: exportTable,
  rows: rowsRef,
  rowKey: props.rowKey,
  parentKey: props.parentKey,
  emit: {
    editSave: payload => emit('row-edit-save', payload),
    refresh: () => emit('refresh'),
    fullScreenChange: val => emit('full-screen-change', val),
  },
  rootRef,
  confirmAsync,
  procFlag: {
    markInsert: procFlag.markInsert,
    markDelete: procFlag.markDelete,
    getFlag: procFlag.getFlag,
  },
  generateTempKey,
  columnState: columns.columnState,
  resetTable,
  expandAll: treeBuilder.expandAll,
  collapseAll: treeBuilder.collapseAll,
})

/**
 * Column manager items — flat list for the column manager dialog.
 * Groups become section headers, leaves are toggleable.
 */
interface ColumnManagerItem {
  col: ColumnDef
  isGroup: boolean
  parentIndex: number
  childIndex: number | null
  isFirst: boolean
  isLast: boolean
}

const columnManagerItems = computed<ColumnManagerItem[]>(() => {
  const items: ColumnManagerItem[] = []
  const state = columns.columnState
  for (let pi = 0; pi < state.length; pi++) {
    const col = state[pi]!
    if (col.children?.length) {
      items.push({ col, isGroup: true, parentIndex: pi, childIndex: null, isFirst: pi === 0, isLast: pi === state.length - 1 })
      for (let ci = 0; ci < col.children.length; ci++) {
        items.push({ col: col.children[ci]!, isGroup: false, parentIndex: pi, childIndex: ci, isFirst: ci === 0, isLast: ci === col.children.length - 1 })
      }
    } else {
      items.push({ col, isGroup: false, parentIndex: pi, childIndex: null, isFirst: pi === 0, isLast: pi === state.length - 1 })
    }
  }
  return items
})

function onColumnManagerMoveUp(item: ColumnManagerItem) {
  if (item.childIndex !== null) {
    columns.reorderChildren(item.parentIndex, item.childIndex, item.childIndex - 1)
  } else {
    columns.reorderTopLevel(item.parentIndex, item.parentIndex - 1)
  }
}

function onColumnManagerMoveDown(item: ColumnManagerItem) {
  if (item.childIndex !== null) {
    columns.reorderChildren(item.parentIndex, item.childIndex, item.childIndex + 1)
  } else {
    columns.reorderTopLevel(item.parentIndex, item.parentIndex + 1)
  }
}

// Column manager drag-and-drop
const cmDragSource = ref<{ parentIndex: number; childIndex: number | null } | null>(null)
const cmDropTarget = ref<{ parentIndex: number; childIndex: number | null; position: 'before' | 'after' } | null>(null)

function isCmDropValid(target: ColumnManagerItem): boolean {
  const src = cmDragSource.value
  if (!src) return false
  if (src.childIndex !== null && target.childIndex !== null) return src.parentIndex === target.parentIndex
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
    'cm-drop-after': !!tgt && tgt.parentIndex === item.parentIndex && tgt.childIndex === item.childIndex && tgt.position === 'after',
  }
}

// Computed scroll height from tableHeight offset
const computedScrollHeight = computed(() => {
  if (props.tableHeight != null) return `calc(100vh - ${props.tableHeight}px)`
  if (props.stickyHeader) return undefined
  return undefined
})

// Tree level CSS vars — sets --tree-level on <tr> elements based on aria-level
function applyTreeLevelCssVars() {
  const root = rootRef.value
  if (!root) return
  const rows = root.querySelectorAll<HTMLElement>('.p-treetable-tbody > tr[aria-level]')
  rows.forEach((tr) => {
    const level = tr.getAttribute('aria-level')
    if (level) {
      tr.style.setProperty('--tree-level', level)
    }
  })

  // Add tree-has-next-sibling class
  const allRows = Array.from(rows)
  for (let i = 0; i < allRows.length; i++) {
    const tr = allRows[i]!
    const level = tr.getAttribute('aria-level')
    tr.classList.remove('tree-has-next-sibling')

    // Check if a later row has the same level (next sibling at same depth)
    for (let j = i + 1; j < allRows.length; j++) {
      const nextLevel = allRows[j]!.getAttribute('aria-level')
      if (nextLevel === level) {
        tr.classList.add('tree-has-next-sibling')
        break
      }
      // If we encounter a row with a lower level number, stop — we've left this subtree
      if (Number(nextLevel) < Number(level)) break
    }
  }
}

// Fullscreen class
const isFullscreen = ref(false)
function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}
onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  nextTick(() => applyTreeLevelCssVars())
})
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})

// Re-apply when expandedKeys change
watch(treeBuilder.expandedKeys, () => {
  nextTick(() => applyTreeLevelCssVars())
}, { deep: true })

// PTreeTable events
function onNodeExpand(node: any) {
  emit('node-expand', node)
  nextTick(() => applyTreeLevelCssVars())
}

function onNodeCollapse(node: any) {
  emit('node-collapse', node)
  nextTick(() => applyTreeLevelCssVars())
}

// Paginated tree nodes (root-level only, sliced for client-side pagination)
const paginatedTreeNodes = computed(() => {
  const roots = treeBuilder.treeNodes.value
  if (paginationModeRef.value === 'server') return roots
  const start = pagination.first.value
  const end = start + pagination.currentPageSize.value
  return roots.slice(start, end)
})

// Expose API
defineExpose({
  // Base
  exportTable: exportTable.exportTable,
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
  isValid: validation.isValid,
  // Tree-specific
  expandAll: treeBuilder.expandAll,
  collapseAll: treeBuilder.collapseAll,
  expandNode: (key: string | number) => {
    treeBuilder.expandedKeys.value[String(key)] = true
  },
  collapseNode: (key: string | number) => {
    delete treeBuilder.expandedKeys.value[String(key)]
  },
  getChildren: treeBuilder.getChildren,
  reparentNode: (nodeKey: string | number, newParentKey: string | number | null) => {
    treeBuilder.reparentNode(nodeKey, newParentKey)
    emit('node-reparent', { nodeKey, newParentKey })
  },
})
</script>

<template>
  <div
    ref="rootRef"
    class="app-tree-data-table"
    :class="{ 'is-fullscreen': isFullscreen }"
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

      <PTreeTable
        ref="treeTableRef"
        v-model:expandedKeys="treeBuilder.expandedKeys.value"
        v-model:selectionKeys="selectionKeysModel"
        :value="loading ? [] : paginatedTreeNodes"
        :loading="false"
        :show-gridlines="showGridlines"
        :striped-rows="stripedRows"
        :resizable-columns="resizableColumns"
        column-resize-mode="expand"
        :reorderable-columns="reorderableColumns"
        :scroll-height="computedScrollHeight"
        :scrollable="!!computedScrollHeight || stickyHeader"
        :sort-field="sort.sortField.value"
        :sort-order="sort.sortOrder.value"
        :multi-sort-meta="sort.multiSortMeta.value"
        sort-mode="multiple"
        :removable-sort="true"
        :selection-mode="selectable ? (selectionMode === 'checkbox' ? 'checkbox' : selectionMode) : undefined"
        :lazy="paginationMode === 'server'"
        @sort="sort.onSort"
        @column-resize-end="() => columns.onColumnResizeEnd(treeTableRef)"
        @row-contextmenu="menus.onRowContextMenu"
        @node-expand="onNodeExpand"
        @node-collapse="onNodeCollapse"
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

        <!-- Checkbox selection column -->
        <PColumn
          v-if="selectable && selectionMode === 'checkbox'"
          selection-mode="multiple"
          :frozen="true"
          :style="{ width: '50px' }"
        />

        <!-- Data columns -->
        <PColumn
          v-for="(col, colIndex) in bodyColumns"
          :key="col.field!"
          :field="col.field"
          :sortable="col.sortable !== false"
          :frozen="col.frozen"
          :expander="colIndex === 0"
          :style="{
            width: (col.width ?? defaultColumnWidth) + 'px',
            minWidth: (col.minWidth ?? 80) + 'px',
            textAlign: col.align ?? 'left',
            ...(col.frozen ? { borderRight: '0.5px solid var(--p-datatable-body-cell-border-color)' } : {})
          }"
        >
          <!-- Header -->
          <template #header>
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
          <template #body="{ node }">
            <div
              v-tooltip.top="validation.hasError(node.data, col.field!) ? validation.getCellErrors(node.data, col.field!).join('\n') : undefined"
              :data-field="col.field"
              class="cell-content"
              :class="{ 'cell-invalid': validation.hasError(node.data, col.field!) }"
              @click="onCellClick(node, col)"
            >
              <slot
                :name="`body-${col.field}`"
                :data="node.data"
                :column="col"
                :node="node"
              >
                <!-- Editing mode (custom, not PDataTable editMode) -->
                <template v-if="edit.isEditing(node.key, col.field!) && editable && col.editType !== 'checkbox' && col.editType !== 'toggle'">
                  <div
                    class="cell-editor"
                    @keydown="(e: KeyboardEvent) => onEditorKeydown(e, node, col)"
                    @focusout="(e: FocusEvent) => onEditorBlur(e, node, col)"
                  >
                    <template v-if="edit.isCellEditable(node.data, col.field!) && !edit.isCellDisabled(node.data, col.field!)">
                      <TableCellEditor
                        :value="node.data[col.field!]"
                        :field="col.field!"
                        :row="node.data"
                        :col-def="col"
                        :options="edit.getCellOptions(node.data, col)"
                        @update:value="(val: any) => { node.data[col.field!] = val; edit.onEditorValueChange(col.field!, val) }"
                      />
                    </template>
                    <template v-else>
                      <span
                        class="cell-text"
                        :class="{ 'opacity-50': edit.isCellDisabled(node.data, col.field!) }"
                      >
                        <component
                          :is="() => col.render!(node.data[col.field!], node.data, col)"
                          v-if="col.render"
                        />
                        <template v-else>{{ edit.getCellDisplayValue(node.data[col.field!], node.data, col) }}</template>
                      </span>
                    </template>
                  </div>
                </template>

                <!-- Checkbox/toggle inline (always visible, no edit mode needed) -->
                <template v-else-if="(col.editType === 'checkbox' || col.editType === 'toggle') && editable && edit.isCellEditable(node.data, col.field!)">
                  <div
                    class="flex items-center justify-center"
                    :class="{ 'opacity-50': edit.isCellDisabled(node.data, col.field!) }"
                  >
                    <PCheckbox
                      v-if="col.editType === 'checkbox'"
                      :model-value="node.data[col.field!]"
                      :binary="true"
                      :disabled="edit.isCellDisabled(node.data, col.field!)"
                      v-bind="col.editProps"
                      @update:model-value="(val: any) => onInlineToggleWithValidation(node.data, col.field!, val)"
                    />
                    <PToggleSwitch
                      v-else
                      :model-value="node.data[col.field!]"
                      :disabled="edit.isCellDisabled(node.data, col.field!)"
                      v-bind="col.editProps"
                      @update:model-value="(val: any) => onInlineToggleWithValidation(node.data, col.field!, val)"
                    />
                  </div>
                </template>
                <template v-else-if="col.editType === 'checkbox' || col.editType === 'toggle'">
                  <div
                    class="flex items-center justify-center"
                    :class="{ 'opacity-50': edit.isCellDisabled(node.data, col.field!) }"
                  >
                    <i
                      class="pi text-sm"
                      :class="(col.editProps?.trueValue !== undefined ? node.data[col.field!] === col.editProps.trueValue : node.data[col.field!]) ? 'pi-check-circle text-green-500' : 'pi-times-circle text-surface-400'"
                    />
                  </div>
                </template>

                <!-- Normal display -->
                <span
                  v-else
                  class="cell-text"
                  :class="{ 'opacity-50': edit.isCellDisabled(node.data, col.field!) }"
                >
                  <component
                    :is="() => col.render!(node.data[col.field!], node.data, col)"
                    v-if="col.render"
                  />
                  <template v-else>{{ edit.getCellDisplayValue(node.data[col.field!], node.data, col) }}</template>
                </span>
              </slot>
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
      </PTreeTable>
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
.app-tree-data-table.is-fullscreen {
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

:deep(.dark) .app-tree-data-table.is-fullscreen {
  background: var(--p-surface-900);
}

/* Dense enterprise cell padding */
:deep(.p-treetable-tbody > tr > td) {
  padding: 0.25rem 0.5rem;
}
:deep(.p-treetable-thead > tr > th) {
  padding: 0.3rem 0.5rem;
}

/*
 * Z-index layering for frozen columns + sticky header/footer.
 */

/* Sticky thead/tfoot: z-2 so entire header/footer sits above frozen body cells */
:deep(.p-treetable-scrollable-table > .p-treetable-thead) {
  z-index: 2 !important;
}

:deep(.p-treetable-scrollable-table > .p-treetable-tfoot) {
  z-index: 2 !important;
}

/* Frozen body cells: opaque + z-1 (above non-frozen siblings on horizontal scroll) */
:deep(.p-treetable-tbody > tr > td.p-treetable-frozen-column) {
  background: var(--p-datatable-row-background);
  z-index: 1 !important;
}

/* Frozen header cells: opaque + z-1 within thead stacking context (horizontal scroll) */
:deep(.p-treetable-thead > tr > th.p-treetable-frozen-column) {
  background: var(--p-datatable-header-cell-background);
}

/* Frozen footer cells: opaque + z-1 within tfoot stacking context */
:deep(.p-treetable-tfoot > tr > td.p-treetable-frozen-column) {
  background: var(--p-datatable-footer-cell-background);
}

/* Frozen column right border for visual separation */
:deep(th.p-treetable-frozen-column),
:deep(td.p-treetable-frozen-column) {
  border-right: 0.5px solid var(--p-datatable-body-cell-border-color);
}

/* Force cells to respect column width and truncate overflow */
:deep(.p-treetable-tbody > tr > td) {
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

/* Column drag-and-drop visual feedback */
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

/* Validation error — red outline on td */
:deep(td:has(.cell-invalid)) {
  outline: 2px solid var(--p-red-400);
  outline-offset: -2px;
}

/* Smaller tooltip text for validation errors */
:deep(.p-tooltip .p-tooltip-text) {
  font-size: 0.7rem;
  line-height: 1.3;
}

/* ==================== Hierarchy indent lines ==================== */
:deep(.p-treetable-tbody > tr[aria-level]:not([aria-level="1"]) > td:first-child) {
  position: relative;
}

:deep(.p-treetable-tbody > tr[aria-level]:not([aria-level="1"]) > td:first-child::before) {
  content: '';
  position: absolute;
  top: 0;
  bottom: 50%;
  left: calc((var(--tree-level, 0) - 1) * 1rem + 0.75rem);
  width: 1px;
  background: var(--p-surface-300);
  pointer-events: none;
}

:deep(.p-treetable-tbody > tr[aria-level]:not([aria-level="1"]) > td:first-child::after) {
  content: '';
  position: absolute;
  top: 50%;
  left: calc((var(--tree-level, 0) - 1) * 1rem + 0.75rem);
  width: 0.75rem;
  height: 1px;
  background: var(--p-surface-300);
  pointer-events: none;
}

:deep(.p-treetable-tbody > tr.tree-has-next-sibling > td:first-child::before) {
  bottom: 0;
}

/* Dark mode hierarchy lines */
.dark :deep(.p-treetable-tbody > tr[aria-level]:not([aria-level="1"]) > td:first-child::before),
.dark :deep(.p-treetable-tbody > tr[aria-level]:not([aria-level="1"]) > td:first-child::after) {
  background: var(--p-surface-600);
}

/* ==================== Tablet ==================== */
@media (min-width: 640px) and (max-width: 1023px) {
  /* Cell padding + font */
  :deep(.p-treetable-tbody > tr > td),
  :deep(.p-treetable-thead > tr > th) {
    padding: 0.25rem 0.375rem;
    font-size: 0.75rem;
  }

  /* Header text truncation */
  :deep(.p-treetable-thead > tr > th) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Footer */
  :deep(.p-treetable-tfoot > tr > td) {
    padding: 0.25rem 0.375rem;
    font-size: 0.75rem;
  }

  /* Header sort icon + badge */
  :deep(.p-treetable-sort-icon) {
    width: 0.7rem;
    height: 0.7rem;
  }
  :deep(.p-treetable-sort-badge) {
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
  :deep(.p-treetable-tbody > tr > td),
  :deep(.p-treetable-thead > tr > th) {
    padding: 0.1875rem 0.25rem;
    font-size: 0.6875rem;
  }

  /* Header text truncation */
  :deep(.p-treetable-thead > tr > th) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Header sort icon + badge */
  :deep(.p-treetable-sort-icon) {
    width: 0.5625rem;
    height: 0.5625rem;
  }
  :deep(.p-treetable-sort-badge) {
    font-size: 0.4375rem;
    min-width: 0.75rem;
    height: 0.75rem;
  }

  /* Footer */
  :deep(.p-treetable-tfoot > tr > td) {
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
