import type { VNode } from 'vue'

export type DataMode = 'pagination' | 'infiniteScroll'
export type BackendMode = 'client' | 'server'
export type SelectionMode = 'single' | 'multiple' | 'checkbox'
export type EditType = 'input' | 'number' | 'date' | 'datetime' | 'time' | 'select' | 'multiselect' | 'checkbox' | 'toggle'
export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count'
export type ExportFormat = 'csv' | 'xlsx'
export type ExportScope = 'all' | 'visible' | 'selected'

export interface ExcelProps {
  type?: 'number' | 'string' | 'date' | 'boolean'
  format?: string
}

export interface ColumnDef {
  field: string
  header: string
  width?: number
  minWidth?: number
  sortable?: boolean
  editable?: boolean
  editType?: EditType
  editOptions?: any[]
  editProps?: Record<string, any>
  frozen?: boolean
  hidden?: boolean
  align?: 'left' | 'center' | 'right'
  render?: (val: any, row: any, col: ColumnDef) => VNode | VNode[]
  format?: (val: any, row: any) => string
  aggregation?: AggregationType
  excelProps?: ExcelProps
}

export interface FooterAgg {
  field: string
  type: AggregationType
  format?: (val: number) => string
}

export interface CellConfig {
  editable?: boolean
  disabled?: boolean
  options?: any[]
  render?: (val: any, row: any) => string
}

export interface PageEvent {
  page: number
  pageSize: number
}

export interface SortEvent {
  field: string
  order: 1 | -1
  multiSortMeta?: Array<{ field: string; order: 1 | -1 }>
}

export interface EditSaveEvent<T = any> {
  oldRow: T | null
  newRow: T
  field?: string
}

export interface AppDataTableProps<T = any> {
  rows: T[]
  columns: ColumnDef[]
  totalRecords?: number
  loading?: boolean
  rowKey?: string
  dataMode?: DataMode
  virtualScroll?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  paginationMode?: BackendMode
  virtualRowHeight?: number
  scrollHeight?: string
  onLoadMore?: (params: PageEvent) => Promise<void>
  sortBackend?: BackendMode
  defaultSortField?: string
  defaultSortOrder?: 1 | -1
  editable?: boolean
  editableColumns?: string[]
  selectable?: boolean
  selectionMode?: SelectionMode
  tableHeight?: string
  showGridlines?: boolean
  stripedRows?: boolean
  resizableColumns?: boolean
  reorderableColumns?: boolean
  stickyHeader?: boolean
  frozenColumns?: string[]
  maxFrozenColumns?: number
  showFooter?: boolean
  footerAggregations?: FooterAgg[]
  rowContextMenu?: boolean
  headerContextMenu?: boolean
  exportFilename?: string
  exportFormats?: ExportFormat[]
  cellConfig?: (row: T, field: string) => CellConfig | void
  defaultColumnWidth?: number
}

export interface AppDataTableEmits<T = any> {
  (e: 'page', payload: PageEvent): void
  (e: 'sort', payload: SortEvent): void
  (e: 'row-edit-save', payload: EditSaveEvent<T>): void
  (e: 'load-more'): void
  (e: 'full-screen-change', isFullscreen: boolean): void
  (e: 'selection-change', selected: T[]): void
  (e: 'refresh'): void
}
