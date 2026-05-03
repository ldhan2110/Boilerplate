import type {
  ColumnDef,
  DataMode,
  BackendMode,
  SelectionMode,
  PageEvent,
  SortEvent,
  FooterAgg,
  ExportFormat,
  ExportScope,
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

  // Data mode
  dataMode?: DataMode
  virtualScroll?: boolean
  onLoadMore?: (params: PageEvent) => Promise<void>

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

  // Expand
  defaultExpandAll?: boolean

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

export interface AppTreeDataTableExposed {
  expandAll: () => void
  collapseAll: () => void
  resetTable: () => void
  resetColumns: () => void
  clearSort: () => void
  clearSelection: () => void
  getSelectedRows: () => any[]
  hasSelectedRow: () => boolean
  exportTable: (format: ExportFormat, scope: ExportScope) => Promise<void>
  refresh: () => void
}

export type { ColumnDef, DataMode, BackendMode, SelectionMode, PageEvent, SortEvent, FooterAgg, ExportFormat, ExportScope }
