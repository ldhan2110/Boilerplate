<script setup lang="ts">
import type {
  ColumnDef,
  AppDataTableProps,
  PageEvent,
  SortEvent,
  EditSaveEvent,
  ExportFormat,
  ExportScope,
} from '~/types/table'
import {
  useTableColumns,
  useTableSort,
  useTablePagination,
  useTableSelection,
  useTableEdit,
  useTableFooter,
  useTableExport,
  useTableMenus,
} from '~/composables/table'

const props = withDefaults(defineProps<AppDataTableProps>(), {
  rowKey: 'id',
  dataMode: 'pagination',
  virtualScroll: false,
  pageSize: 25,
  pageSizeOptions: () => [10, 25, 50, 100],
  paginationMode: 'server',
  virtualRowHeight: 46,
  scrollHeight: '600px',
  sortMode: 'single',
  sortBackend: 'server',
  defaultSortOrder: 1,
  editable: false,
  editMode: 'cell',
  selectable: false,
  selectionMode: 'multiple',
  tableHeight: undefined,
  showGridlines: true,
  stripedRows: true,
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
  editableColumns: undefined,
})

const emit = defineEmits<{
  (e: 'page', payload: PageEvent): void
  (e: 'sort', payload: SortEvent): void
  (e: 'row-edit-save', payload: EditSaveEvent): void
  (e: 'row-edit-cancel', payload: { row: any }): void
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

const columnsRef = computed(() => props.columns)
const totalRecordsRef = computed(() => props.totalRecords)
const frozenColumnsRef = computed(() => props.frozenColumns)
const maxFrozenColumnsRef = computed(() => props.maxFrozenColumns)
const defaultColumnWidthRef = computed(() => props.defaultColumnWidth)
const sortModeRef = computed(() => props.sortMode)
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
const editModeRef = computed(() => props.editMode)
const editableColumnsRef = computed(() => props.editableColumns)
const rowKeyRef = computed(() => props.rowKey)
const showFooterRef = computed(() => props.showFooter)
const footerAggregationsRef = computed(() => props.footerAggregations)
const headerContextMenuRef = computed(() => props.headerContextMenu)
const rowContextMenuRef = computed(() => props.rowContextMenu)
const exportFilenameRef = computed(() => props.exportFilename)
const cellConfigRef = computed(() => props.cellConfig)

// --- Wire composables ---
const columns = useTableColumns({
  columns: columnsRef,
  frozenColumns: frozenColumnsRef,
  maxFrozenColumns: maxFrozenColumnsRef,
  defaultColumnWidth: defaultColumnWidthRef,
})

const sort = useTableSort({
  sortMode: sortModeRef,
  sortBackend: sortBackendRef,
  defaultSortField: defaultSortFieldRef,
  defaultSortOrder: defaultSortOrderRef,
  emit: (_, payload) => emit('sort', payload),
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
    page: (payload) => emit('page', payload),
    loadMore: () => emit('load-more'),
  },
})

const selection = useTableSelection({
  selectable: selectableRef,
  selectionMode: selectionModeRef,
  emit: (selected) => emit('selection-change', selected),
})

// Alias for v-model:selection binding (v-model needs a ref, not .value)
const selectedRowsModel = selection.selectedRows

const edit = useTableEdit({
  editable: editableRef,
  editMode: editModeRef,
  editableColumns: editableColumnsRef,
  columnState: columns.columnState,
  visibleColumns: columns.visibleColumns,
  rows: rowsRef,
  displayedRows: pagination.displayedRows,
  rowKey: rowKeyRef,
  cellConfig: cellConfigRef,
  dataTableRef,
  emit: {
    editSave: (payload) => emit('row-edit-save', payload),
    editCancel: (payload) => emit('row-edit-cancel', payload),
  },
})

const footer = useTableFooter({
  rows: rowsRef,
  visibleColumns: columns.visibleColumns,
  footerAggregations: footerAggregationsRef,
  showFooter: showFooterRef,
})

const exportTable = useTableExport({
  rows: rowsRef,
  displayedRows: pagination.displayedRows,
  selectedRows: selection.selectedRows,
  visibleColumns: columns.visibleColumns,
  exportFilename: exportFilenameRef,
})

const { confirmAsync } = useAppDialog()

const menus = useTableMenus({
  editable: editableRef,
  sortMode: sortModeRef,
  headerContextMenu: headerContextMenuRef,
  rowContextMenu: rowContextMenuRef,
  columns,
  sort,
  selection,
  exportFn: exportTable,
  rows: rowsRef,
  rowKey: rowKeyRef,
  emit: {
    editSave: (payload) => emit('row-edit-save', payload),
    refresh: () => emit('refresh'),
    fullScreenChange: (val) => emit('full-screen-change', val),
  },
  rootRef,
  confirmAsync,
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
  exportTable: exportTable.exportTable,
  scrollToTop,
  resetColumns: columns.resetColumns,
  clearSelection: selection.clearSelection,
  clearSort: sort.clearSort,
  clearDirty: edit.clearDirty,
  getDirtyRows: edit.getDirtyRows,
  refresh: () => emit('refresh'),
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
    <div v-if="$slots.toolbar || sort.sortChips.value.length > 0" class="mb-2 flex items-center gap-2 flex-wrap">
      <slot name="toolbar" />
      <!-- Sort chips (server mode) -->
      <template v-if="sortBackend === 'server' && sort.sortChips.value.length > 0">
        <span
          v-for="chip in sort.sortChips.value"
          :key="chip.field"
          class="inline-flex items-center gap-1 rounded-full bg-primary-100 dark:bg-primary-900 px-2 py-0.5 text-xs"
        >
          {{ chip.label }}
          <button class="pi pi-times text-xs cursor-pointer" @click="sort.removeFromSort(chip.field)" />
        </span>
        <button class="text-xs text-surface-500 hover:text-surface-700 cursor-pointer" @click="sort.clearSort()">
          {{ $t('table.clearAllSorts') }}
        </button>
      </template>
    </div>

    <!-- Loading overlay for refresh -->
    <div class="relative">
      <div v-if="menus.isRefreshing.value" class="absolute inset-0 z-10 flex items-center justify-center bg-surface-0/50 dark:bg-surface-900/50">
        <PProgressSpinner style="width: 2rem; height: 2rem" />
      </div>

      <PDataTable
        ref="dataTableRef"
        :value="pagination.displayedRows.value"
        :data-key="rowKey"
        :loading="loading"
        :show-gridlines="showGridlines"
        :striped-rows="stripedRows"
        :resizable-columns="resizableColumns"
        column-resize-mode="expand"
        :reorderable-columns="reorderableColumns"
        :scroll-height="tableHeight ?? (virtualScrollRef ? scrollHeight : undefined)"
        :scrollable="!!tableHeight || stickyHeader || virtualScrollRef"
        :virtual-scroller-options="virtualScrollerOptions"
        :sort-field="sort.sortField.value"
        :sort-order="sort.sortOrder.value"
        :multi-sort-meta="sortMode === 'multiple' ? sort.multiSortMeta.value : undefined"
        :sort-mode="sortMode === 'none' ? undefined : sortMode"
        :removable-sort="true"
        v-model:selection="selectedRowsModel"
        :selection-mode="selectable ? (selectionMode === 'checkbox' ? undefined : selectionMode) : undefined"
        :edit-mode="editable ? editMode : undefined"
        :lazy="paginationMode === 'server'"
        @sort="sort.onSort"

        @cell-edit-init="edit.onCellEditInit"
        @cell-edit-complete="edit.onCellEditComplete"
        @row-edit-save="edit.onRowEditSave"
        @row-contextmenu="menus.onRowContextMenu"
      >
        <!-- Empty slot -->
        <template #empty>
          <slot name="empty">
            <div class="text-center py-8 text-surface-400">
              {{ $t('table.noData') }}
            </div>
          </slot>
        </template>

        <!-- Checkbox column for checkbox selection -->
        <PColumn
          v-if="selectable && selectionMode === 'checkbox'"
          selection-mode="multiple"
          :frozen="true"
          style="width: 3rem"
        />

        <!-- Data columns -->
        <PColumn
          v-for="col in columns.visibleColumns.value"
          :key="col.field"
          :field="col.field"
          :sortable="col.sortable !== false && sortMode !== 'none'"
          :frozen="col.frozen"
          :style="{ width: (col.width ?? defaultColumnWidth) + 'px', minWidth: (col.minWidth ?? 80) + 'px', textAlign: col.align ?? 'left' }"
        >
          <!-- Header with context menu trigger -->
          <template #header>
            <div
              class="flex items-center gap-1 w-full"
              @contextmenu.prevent="menus.onHeaderContextMenu($event, col)"
            >
              <slot :name="`header-${col.field}`" :column="col">
                {{ col.header }}
              </slot>
            </div>
          </template>

          <!-- Body -->
          <template #body="{ data, index }">
            <div :data-field="col.field" class="relative">
              <!-- Dirty indicator (first visible column only) -->
              <span
                v-if="col === columns.visibleColumns.value[0] && edit.dirtyRows.value.has(data[rowKey])"
                class="absolute top-1 left-0 w-1.5 h-1.5 rounded-full bg-amber-500"
              />
              <slot :name="`body-${col.field}`" :data="data" :column="col" :index="index">
                <span :class="{ 'opacity-50': edit.isCellDisabled(data, col.field) }">
                  {{ edit.getCellDisplayValue(data[col.field], data, col) }}
                </span>
              </slot>
            </div>
          </template>

          <!-- Cell editor -->
          <template v-if="editable && editMode === 'cell'" #editor="{ data, field, index }">
            <div :data-field="field" @keydown.tab.prevent.stop="edit.handleKeyDown($event)">
            <template v-if="edit.isCellEditable(data, field) && !edit.isCellDisabled(data, field)">
              <TableCellEditor
                :value="data[field]"
                :field="field"
                :row="data"
                :col-def="col"
                :options="edit.getCellOptions(data, col)"
                @update:value="(val: any) => { data[field] = val }"
              />
            </template>
            <template v-else>
              <span :class="{ 'opacity-50': edit.isCellDisabled(data, field) }">
                {{ edit.getCellDisplayValue(data[field], data, col) }}
              </span>
            </template>
            </div>
          </template>

          <!-- Footer -->
          <template v-if="showFooter" #footer>
            <slot :name="`footer-${col.field}`" :column="col" :value="footer.footerValues.value[col.field]">
              <template v-if="footer.footerValues.value[col.field]">
                <span class="font-semibold" :class="{ 'text-right block': col.align === 'right' || ['number'].includes(col.editType ?? '') }">
                  {{ footer.footerValues.value[col.field].formatted }}
                </span>
              </template>
              <template v-else-if="footer.firstNonAggColumn.value === col.field">
                <span class="font-semibold">{{ $t('table.totals') }}</span>
              </template>
            </slot>
          </template>
        </PColumn>

        <!-- Row editor column for row edit mode -->
        <PColumn
          v-if="editable && editMode === 'row'"
          :row-editor="true"
          style="width: 7rem"
          :frozen="true"
          align-frozen="right"
        />
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
    <div v-if="pagination.showPaginator.value" class="flex items-center justify-between gap-4 mt-2 min-h-8">
      <!-- Paginator in center -->
      <div class="flex-1 flex justify-center">
        <PPaginator
          :first="pagination.first.value"
          :rows="pagination.currentPageSize.value"
          :total-records="pagination.totalCount.value"
          :rows-per-page-options="pageSizeOptions"
          @page="pagination.onPageChange"
          class="app-paginator-compact"
        />
      </div>
      <!-- Total rows display (fixed on right) -->
      <span class="text-xs text-surface-600 dark:text-surface-400 whitespace-nowrap mr-[5px]">
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

:deep(.dark) .app-data-table.is-fullscreen {
  background: var(--p-surface-900);
}

/* Compact paginator styling */
:deep(.p-paginator) {
  padding: 0 !important;
  gap: 0.25rem;
  font-size: 0.75rem;
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
</style>
