import type {
  ColumnDef,
  BackendMode,
  SelectionMode,
  PageEvent,
  SortEvent,
  FooterAgg,
  ExportFormat,
} from './table'

export interface TreeNode<T = any> {
  key: string
  data: T
  children?: TreeNode<T>[]
  leaf?: boolean
}

export interface AppTreeDataTableProps<T = any> {
  rows: T[]
  columns: ColumnDef[]
  rowKey?: string
  parentKey?: string
  totalRecords?: number
  loading?: boolean

  // Pagination
  pageSize?: number
  pageSizeOptions?: number[]
  paginationMode?: BackendMode

  // Sort
  sortBackend?: BackendMode
  defaultSortField?: string
  defaultSortOrder?: 1 | -1

  // Selection
  selectable?: boolean
  selectionMode?: SelectionMode

  // Display
  showGridlines?: boolean
  resizableColumns?: boolean
  reorderableColumns?: boolean
  stickyHeader?: boolean
  scrollHeight?: string
  tableHeight?: number

  // Columns
  frozenColumns?: string[]
  maxFrozenColumns?: number
  defaultColumnWidth?: number

  // Menus
  headerContextMenu?: boolean
  rowContextMenu?: boolean

  // Footer
  showFooter?: boolean
  footerAggregations?: FooterAgg[]

  // Export
  exportFilename?: string
  exportFormats?: ExportFormat[]
}

export type { ColumnDef, BackendMode, SelectionMode, PageEvent, SortEvent, FooterAgg, ExportFormat }
