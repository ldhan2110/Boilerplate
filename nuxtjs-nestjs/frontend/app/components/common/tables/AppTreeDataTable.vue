<script setup lang="ts">
import type {
  ColumnDef,
  AppTreeDataTableProps,
  PageEvent,
  SortEvent,
  ExportFormat,
  FooterAgg,
} from '~/types/tree-table'
import type { HeaderCell } from '~/composables/table/useTableSpan'
import {
  useTreeBuilder,
  useTreeTableColumns,
  useTreeTableSort,
  useTreeTablePagination,
} from '~/composables/tree-table'
import { useTableFooter } from '~/composables/table/useTableFooter'
import { useTableExport } from '~/composables/table/useTableExport'

const props = withDefaults(defineProps<AppTreeDataTableProps>(), {
  rowKey: 'id',
  parentKey: 'parentId',
  dataMode: 'pagination',
  virtualScroll: false,
  pageSize: 25,
  pageSizeOptions: () => [10, 25, 50, 100],
  paginationMode: 'server',
  sortBackend: 'server',
  defaultSortOrder: 1,
  selectable: false,
  selectionMode: 'multiple',
  showGridlines: true,
  resizableColumns: true,
  reorderableColumns: true,
  stickyHeader: true,
  maxFrozenColumns: 3,
  defaultColumnWidth: 150,
  headerContextMenu: true,
  rowContextMenu: true,
  showFooter: false,
  footerAggregations: () => [],
  exportFilename: 'export',
  exportFormats: () => ['csv', 'xlsx'] as ExportFormat[],
  frozenColumns: () => [],
})

const emit = defineEmits<{
  (e: 'page', payload: PageEvent): void
  (e: 'sort', payload: SortEvent): void
  (e: 'load-more'): void
  (e: 'node-expand', node: any): void
  (e: 'node-collapse', node: any): void
  (e: 'selection-change', selected: any[]): void
  (e: 'full-screen-change', isFullscreen: boolean): void
  (e: 'refresh'): void
}>()

const { t } = useI18n()
const rootRef = ref<HTMLElement | null>(null)
const treeTableRef = ref<any>(null)

// Reactive prop refs
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
const dataModeRef = computed(() => props.dataMode)
const pageSizeRef = computed(() => props.pageSize)
const pageSizeOptionsRef = computed(() => props.pageSizeOptions)
const paginationModeRef = computed(() => props.paginationMode)
const onLoadMoreRef = computed(() => props.onLoadMore)
const headerContextMenuRef = computed(() => props.headerContextMenu)
const rowContextMenuRef = computed(() => props.rowContextMenu)
const showFooterRef = computed(() => props.showFooter)
const footerAggregationsRef = computed(() => props.footerAggregations)
const exportFilenameRef = computed(() => props.exportFilename)
const reorderableColumnsRef = computed(() => props.reorderableColumns)

// --- Composables ---
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
  emit: (_event, payload) => emit('sort', payload),
})

const pagination = useTreeTablePagination({
  dataMode: dataModeRef,
  paginationMode: paginationModeRef,
  pageSize: pageSizeRef,
  pageSizeOptions: pageSizeOptionsRef,
  rows: rowsRef,
  totalRecords: totalRecordsRef,
  onLoadMore: onLoadMoreRef,
  emit: {
    page: (payload) => emit('page', payload),
    loadMore: () => emit('load-more'),
  },
})

// Reactive ref from columnState so drag tracks reorders + visibility changes
const columnStateRef = computed(() => [...columns.columnState])

// --- Selection (TreeTable uses selectionKeys) ---
const selectionKeys = ref<Record<string, { checked: boolean; partialChecked: boolean }>>({})

const selectedRows = computed(() => {
  if (!props.selectable) return []
  const result: any[] = []
  for (const [key, val] of Object.entries(selectionKeys.value)) {
    if (val.checked) {
      const node = treeBuilder.findNode(key)
      if (node) result.push(node.data)
    }
  }
  return result
})

const hasSelection = computed(() => selectedRows.value.length > 0)

watch(selectionKeys, () => {
  if (props.selectable) emit('selection-change', selectedRows.value)
}, { deep: true })

function clearSelection() {
  selectionKeys.value = {}
}

// --- Footer (reuse generic composable) ---
const footer = useTableFooter({
  rows: rowsRef,
  visibleColumns: columns.visibleColumns,
  footerAggregations: footerAggregationsRef,
  showFooter: showFooterRef,
})

// --- Export (reuse generic composable) ---
const selectedRowsRef = computed(() => selectedRows.value)
const displayedRowsRef = computed(() => treeBuilder.flatFromTree())

const exportTable = useTableExport({
  rows: rowsRef,
  displayedRows: displayedRowsRef,
  selectedRows: selectedRowsRef,
  visibleColumns: columns.visibleColumns,
  exportFilename: exportFilenameRef,
})

// --- Body columns ---
const bodyColumns = computed(() =>
  columns.hasColumnGroups.value ? columns.leafColumns.value : columns.visibleColumns.value
)

// --- Column drag (for grouped header mode) ---
interface DragSource {
  topLevelIndex: number
  childIndex: number | null
  field?: string
}

const isDragging = ref(false)
const dragOverGroupIndex = ref<number | null>(null)
const dragDirection = ref<'left' | 'right' | null>(null)
const dragSource = ref<DragSource | null>(null)

const isColumnDragActive = computed(() => columns.hasColumnGroups.value && reorderableColumnsRef.value)

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
  return cols.findIndex(col => col.children?.length && col.header === cell.header)
}

function resolveCellToSource(cell: HeaderCell): DragSource | null {
  const cols = columns.columnState
  if (cell.field) {
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i]!
      if (col.children?.length) {
        const ci = col.children.findIndex(c => c.field === cell.field)
        if (ci !== -1) return { topLevelIndex: i, childIndex: ci, field: cell.field }
      } else if (col.field === cell.field) {
        return { topLevelIndex: i, childIndex: null, field: cell.field }
      }
    }
    return null
  }
  const idx = cols.findIndex(col => col.children?.length && col.header === cell.header)
  if (idx === -1) return null
  return { topLevelIndex: idx, childIndex: null }
}

function onColumnDragStart(e: DragEvent, cell: HeaderCell) {
  const source = resolveCellToSource(cell)
  if (!source) { e.preventDefault(); return }
  dragSource.value = source
  isDragging.value = true
  e.dataTransfer!.effectAllowed = 'move'
  const el = (e.target as HTMLElement).closest('.grouped-header-cell') || (e.target as HTMLElement)
  el.classList.add('column-drag-source')
}

function onColumnDragOver(e: DragEvent, cell: HeaderCell) {
  if (!dragSource.value) return
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'move'
  const target = resolveCellToSource(cell)
  if (!target) return
  dragOverGroupIndex.value = target.topLevelIndex
  if (dragSource.value.topLevelIndex < target.topLevelIndex) {
    dragDirection.value = 'right'
  } else if (dragSource.value.topLevelIndex > target.topLevelIndex) {
    dragDirection.value = 'left'
  } else if (dragSource.value.childIndex !== null && target.childIndex !== null) {
    dragDirection.value = dragSource.value.childIndex < target.childIndex ? 'right' : 'left'
  } else {
    dragDirection.value = null
  }
}

function onColumnDragLeave(e: DragEvent) {
  const relatedTarget = e.relatedTarget as HTMLElement | null
  const el = (e.target as HTMLElement).closest('.grouped-header-cell') || (e.target as HTMLElement)
  if (el && relatedTarget && el.contains(relatedTarget)) return
  dragOverGroupIndex.value = null
  dragDirection.value = null
}

function onColumnDrop(e: DragEvent, cell: HeaderCell) {
  e.preventDefault()
  if (!dragSource.value) return
  const source = dragSource.value
  const target = resolveCellToSource(cell)
  if (!target) { cleanupDrag(e); return }
  if (source.topLevelIndex === target.topLevelIndex) {
    if (source.childIndex !== null && target.childIndex !== null && source.childIndex !== target.childIndex) {
      columns.reorderChildren(source.topLevelIndex, source.childIndex, target.childIndex)
    }
  } else {
    columns.reorderTopLevel(source.topLevelIndex, target.topLevelIndex)
  }
  cleanupDrag(e)
}

function onColumnDragEnd(e: DragEvent) {
  cleanupDrag(e)
}

function cleanupDrag(e?: DragEvent) {
  isDragging.value = false
  dragSource.value = null
  dragOverGroupIndex.value = null
  dragDirection.value = null
  if (e) {
    const table = (e.target as HTMLElement).closest('.app-tree-data-table')
    if (table) {
      table.querySelectorAll('.column-drag-source').forEach(el => el.classList.remove('column-drag-source'))
    }
  }
}

function getColumnDragAttrs(cell: HeaderCell, _rowIndex: number): Record<string, any> {
  if (!isColumnDragActive.value) return {}
  if (cell.col?.frozen) return {}
  return {
    draggable: true,
    onDragstart: (e: DragEvent) => onColumnDragStart(e, cell),
    onDragover: (e: DragEvent) => onColumnDragOver(e, cell),
    onDragleave: (e: DragEvent) => onColumnDragLeave(e),
    onDrop: (e: DragEvent) => onColumnDrop(e, cell),
    onDragend: (e: DragEvent) => onColumnDragEnd(e),
  }
}

// --- Header Context Menu ---
const headerMenuRef = ref<any>(null)
const rightClickedColumn = ref<ColumnDef | null>(null)
const showColumnManager = ref(false)

const headerMenuModel = computed(() => {
  if (!props.headerContextMenu || !rightClickedColumn.value) return []
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
      command: () => columns.freezeColumn(col.field!),
      disabled: columns.isColumnFrozen(col.field!) || !columns.canFreezeMore.value,
    },
    {
      label: t('table.unfreezeColumn'),
      icon: 'pi pi-lock-open',
      command: () => columns.unfreezeColumn(col.field!),
      disabled: !columns.isColumnFrozen(col.field!),
    },
    { separator: true },
    {
      label: t('table.showHideColumns'),
      icon: 'pi pi-th-large',
      command: () => { showColumnManager.value = true },
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

// --- Row Context Menu ---
const rowMenuRef = ref<any>(null)
const rightClickedRow = ref<any>(null)
const isRefreshing = ref(false)

const rowMenuModel = computed(() => {
  if (!props.rowContextMenu || !rightClickedRow.value) return []
  const items: any[] = []

  items.push(
    {
      label: t('table.copyRow'),
      icon: 'pi pi-clipboard',
      command: () => navigator.clipboard.writeText(JSON.stringify(rightClickedRow.value, null, 2)),
    },
    {
      label: t('table.copySelected'),
      icon: 'pi pi-clipboard',
      command: () => navigator.clipboard.writeText(JSON.stringify(selectedRows.value, null, 2)),
      disabled: !hasSelection.value,
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
      command: () => exportTable.exportTable('csv', 'visible'),
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

function onRowContextMenu(event: MouseEvent, nodeData: any) {
  rightClickedRow.value = nodeData
  rowMenuRef.value?.show(event)
}

async function doRefresh() {
  isRefreshing.value = true
  try {
    emit('refresh')
    await nextTick()
  } finally {
    isRefreshing.value = false
  }
}

// --- Fullscreen ---
const isFullscreenState = ref(false)

function isFullscreen(): boolean {
  return !!document.fullscreenElement
}

function toggleFullscreen() {
  if (!rootRef.value) return
  if (document.fullscreenElement) {
    document.exitFullscreen()
    emit('full-screen-change', false)
  } else {
    rootRef.value.requestFullscreen()
    emit('full-screen-change', true)
  }
}

function onFullscreenChange() {
  isFullscreenState.value = !!document.fullscreenElement
}
onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  pagination.setupInfiniteScroll()
})
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  pagination.teardownInfiniteScroll()
})

// --- Column Manager DnD ---
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

// --- Scroll height ---
const computedScrollHeight = computed(() => {
  if (props.tableHeight != null) return `calc(100vh - ${props.tableHeight}px)`
  if (props.scrollHeight) return props.scrollHeight
  return undefined
})

// --- Expand / Collapse ---
function expandAll() { treeBuilder.expandAll() }
function collapseAll() { treeBuilder.collapseAll() }

// --- Reset ---
function resetTable() {
  columns.resetColumns()
  sort.clearSort()
  clearSelection()
}

// --- Exposed API ---
defineExpose({
  expandAll,
  collapseAll,
  resetTable,
  resetColumns: columns.resetColumns,
  clearSort: sort.clearSort,
  clearSelection,
  getSelectedRows: () => selectedRows.value,
  hasSelectedRow: () => hasSelection.value,
  exportTable: exportTable.exportTable,
  refresh: () => emit('refresh'),
})
</script>

<template>
  <div
    ref="rootRef"
    class="app-tree-data-table"
    :class="{ 'is-fullscreen': isFullscreenState }"
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
        v-if="isRefreshing"
        class="absolute inset-0 z-10 flex items-center justify-center bg-surface-0/50 dark:bg-surface-900/50"
      >
        <PProgressSpinner style="width: 2rem; height: 2rem" />
      </div>

      <PTreeTable
        ref="treeTableRef"
        :value="treeBuilder.treeNodes.value"
        v-model:expandedKeys="treeBuilder.expandedKeys.value"
        v-model:selectionKeys="selectionKeys"
        :selection-mode="selectable ? (selectionMode === 'checkbox' ? 'checkbox' : selectionMode) : undefined"
        :loading="loading"
        :show-gridlines="showGridlines"
        :resizable-columns="resizableColumns"
        column-resize-mode="expand"
        :scroll-height="computedScrollHeight"
        :scrollable="!!computedScrollHeight || stickyHeader"
        :sort-field="sort.sortField.value"
        :sort-order="sort.sortOrder.value"
        :multi-sort-meta="sort.multiSortMeta.value"
        sort-mode="multiple"
        :removable-sort="true"
        :lazy="paginationMode === 'server'"
        @column-resize-end="() => columns.onColumnResizeEnd(treeTableRef)"
        @sort="sort.onSort"
        @node-expand="(node: any) => emit('node-expand', node)"
        @node-collapse="(node: any) => emit('node-collapse', node)"
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

        <!-- Data columns -->
        <PColumn
          v-for="col in bodyColumns"
          :key="col.field!"
          :field="col.field"
          :sortable="col.sortable !== false"
          :frozen="col.frozen"
          :expander="col === bodyColumns[0]"
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
              @contextmenu.prevent="onHeaderContextMenu($event, col)"
            >
              <slot :name="`header-${col.field}`" :column="col">
                {{ col.header }}
              </slot>
            </div>
          </template>

          <!-- Body -->
          <template #body="{ node }">
            <div
              class="cell-content"
              :class="{ 'cell-align-right': col.align === 'right', 'cell-align-center': col.align === 'center' }"
              @contextmenu.prevent="onRowContextMenu($event, node.data)"
            >
              <slot
                :name="`body-${col.field}`"
                :data="node.data"
                :node="node"
                :column="col"
              >
                <span class="cell-text">
                  <component
                    :is="() => col.render!(node.data[col.field!], node.data, col)"
                    v-if="col.render"
                  />
                  <template v-else>{{ col.format ? col.format(node.data[col.field!], node.data) : node.data[col.field!] }}</template>
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
              :rows="rows"
            >
              <template v-if="footer.footerValues.value[col.field!]">
                <span
                  class="font-semibold"
                  :class="{ 'text-right block': col.align === 'right' }"
                >
                  {{ footer.footerValues.value[col.field!]?.formatted }}
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
      <span class="text-xs text-surface-600 dark:text-surface-400 whitespace-nowrap mr-1.25">
        Total: {{ pagination.totalCount.value }} row(s)
      </span>
    </div>

    <!-- Header Context Menu -->
    <PContextMenu
      :ref="(el: any) => { headerMenuRef = el }"
      :model="headerMenuModel"
      :global="false"
    />

    <!-- Row Context Menu -->
    <PContextMenu
      :ref="(el: any) => { rowMenuRef = el }"
      :model="rowMenuModel"
      :global="false"
    />

    <!-- Column Manager Dialog -->
    <PDialog
      v-model:visible="showColumnManager"
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
/* Fullscreen mode */
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

:deep(.dark) .app-tree-data-table.is-fullscreen {
  background: var(--p-surface-900);
}

/* Checkbox compact */
:deep(.p-checkbox) {
  height: 1.25rem !important;
  width: 1.25rem !important;
}

:deep(td) {
  padding: 0px;
}

/* Dense enterprise cell padding — matches AppDataTable */
:deep(.p-treetable-tbody > tr > td) {
  padding: 0.25rem 0.5rem;
  max-width: 0;
}
:deep(.p-treetable-thead > tr > th) {
  padding: 0.3rem 0.5rem;
}

/* Footer cells */
:deep(.p-treetable-tfoot > tr > td) {
  padding: 0.3rem 0.5rem;
}

.cell-content {
  overflow: hidden;
  min-height: 1.25rem;
}

.cell-align-right {
  text-align: right;
}

.cell-align-center {
  text-align: center;
}

/* PTreeTable wraps body content in a flex div (.p-treetable-body-cell-content),
   so text-align on td is ignored. Override justify-content to align cell content. */
:deep(td:has(.cell-align-right) > .p-treetable-body-cell-content) {
  justify-content: flex-end;
}

:deep(td:has(.cell-align-center) > .p-treetable-body-cell-content) {
  justify-content: center;
}

.cell-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* Frozen body cells: opaque + z-1 */
:deep(.p-treetable-tbody > tr > td.p-treetable-frozen-column) {
  background: var(--p-datatable-row-background);
  z-index: 1 !important;
}

/* Frozen header cells: opaque */
:deep(.p-treetable-thead > tr > th.p-treetable-frozen-column) {
  background: var(--p-datatable-header-cell-background);
}

/* Frozen footer cells: opaque */
:deep(.p-treetable-tfoot > tr > td.p-treetable-frozen-column) {
  background: var(--p-datatable-footer-cell-background);
}

/* Frozen column right border for visual separation */
:deep(th.p-treetable-frozen-column),
:deep(td.p-treetable-frozen-column) {
  border-right: 0.5px solid var(--p-datatable-body-cell-border-color);
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

/* ==================== Tablet ==================== */
@media (min-width: 640px) and (max-width: 1023px) {
  :deep(.p-treetable-tbody > tr > td),
  :deep(.p-treetable-thead > tr > th) {
    padding: 0.25rem 0.375rem;
    font-size: 0.75rem;
  }

  :deep(.p-treetable-thead > tr > th) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.p-treetable-tfoot > tr > td) {
    padding: 0.25rem 0.375rem;
    font-size: 0.75rem;
  }

  :deep(.p-treetable-sort-icon) {
    width: 0.7rem;
    height: 0.7rem;
  }
  :deep(.p-treetable-sort-badge) {
    font-size: 0.5rem;
    min-width: 0.875rem;
    height: 0.875rem;
  }

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
  :deep(.p-treetable-tbody > tr > td),
  :deep(.p-treetable-thead > tr > th) {
    padding: 0.1875rem 0.25rem;
    font-size: 0.6875rem;
  }

  :deep(.p-treetable-thead > tr > th) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.p-treetable-tfoot > tr > td) {
    padding: 0.1875rem 0.25rem;
    font-size: 0.6875rem;
  }

  :deep(.p-treetable-sort-icon) {
    width: 0.5625rem;
    height: 0.5625rem;
  }
  :deep(.p-treetable-sort-badge) {
    font-size: 0.4375rem;
    min-width: 0.75rem;
    height: 0.75rem;
  }

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
