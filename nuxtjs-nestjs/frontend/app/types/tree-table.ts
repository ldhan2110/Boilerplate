import type {
  ColumnDef,
  DataMode,
  BackendMode,
  SelectionMode,
  ExportFormat,
  FooterAgg,
  CellConfig,
  PageEvent,
  SortEvent,
  EditSaveEvent,
  ProcFlag,
  ValidationError,
} from './table'

export interface TreeNode<T = any> {
  key: string | number
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
  dataMode?: DataMode
  pageSize?: number
  pageSizeOptions?: number[]
  paginationMode?: BackendMode
  scrollHeight?: string
  sortBackend?: BackendMode
  defaultSortField?: string
  defaultSortOrder?: 1 | -1
  editable?: boolean
  editableColumns?: string[]
  selectable?: boolean
  selectionMode?: SelectionMode
  tableHeight?: number
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
  draggableRows?: boolean
}

// Re-export for convenience
export type {
  ColumnDef,
  DataMode,
  BackendMode,
  SelectionMode,
  ExportFormat,
  FooterAgg,
  CellConfig,
  PageEvent,
  SortEvent,
  EditSaveEvent,
  ProcFlag,
  ValidationError,
}
