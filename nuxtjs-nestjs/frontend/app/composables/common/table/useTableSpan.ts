import type { ColumnDef } from '~/types/table'

export interface HeaderCell {
  header: string
  colspan: number
  rowspan: number
  col?: ColumnDef     // present only for leaf cells
  field?: string      // present only for leaf cells
}

export interface UseTableSpanOptions {
  columns: Ref<ColumnDef[]>
  displayedRows: Ref<any[]>
}

export interface UseTableSpanReturn {
  headerRows: ComputedRef<HeaderCell[][]>
  leafColumns: ComputedRef<ColumnDef[]>
  hasColumnGroups: ComputedRef<boolean>
  getBodyRowSpan: (row: any, field: string, index: number) => number
  getMergeGroupIndices: (index: number, field: string) => number[]
  spanFields: ComputedRef<string[]>
}

/** Count leaf nodes under a column (recursively). */
function countLeaves(col: ColumnDef): number {
  if (!col.children?.length) return 1
  return col.children.reduce((sum, child) => sum + countLeaves(child), 0)
}

/** Find max depth of the column tree. */
function getMaxDepth(columns: ColumnDef[]): number {
  let max = 1
  for (const col of columns) {
    if (col.children?.length) {
      const childDepth = 1 + getMaxDepth(col.children)
      if (childDepth > max) max = childDepth
    }
  }
  return max
}

/** Flatten column tree to leaf columns in left-to-right order. */
function flattenLeaves(columns: ColumnDef[]): ColumnDef[] {
  const leaves: ColumnDef[] = []
  for (const col of columns) {
    if (col.children?.length) {
      if (import.meta.dev && col.field) {
        console.warn(`[useTableSpan] Column "${col.header}" has both 'field' and 'children'. It will be treated as a group node; 'field' is ignored.`)
      }
      leaves.push(...flattenLeaves(col.children))
    } else {
      if (import.meta.dev && !col.field) {
        console.warn(`[useTableSpan] Column "${col.header}" has neither 'field' nor 'children'. It will be skipped.`)
      } else {
        leaves.push(col)
      }
    }
  }
  return leaves
}

/**
 * Build header rows from column tree.
 * Each row is an array of HeaderCell objects with colspan/rowspan calculated.
 */
function buildHeaderRows(columns: ColumnDef[], maxDepth: number): HeaderCell[][] {
  const rows: HeaderCell[][] = Array.from({ length: maxDepth }, () => [])

  function walk(cols: ColumnDef[], depth: number) {
    for (const col of cols) {
      if (col.children?.length) {
        // Group node: placed at current depth, spans columns
        rows[depth]!.push({
          header: col.header,
          colspan: countLeaves(col),
          rowspan: 1,
        })
        walk(col.children, depth + 1)
      } else {
        // Leaf node: placed at current depth, spans remaining rows
        rows[depth]!.push({
          header: col.header,
          colspan: 1,
          rowspan: maxDepth - depth,
          col,
          field: col.field,
        })
      }
    }
  }

  walk(columns, 0)
  return rows
}

export function useTableSpan(options: UseTableSpanOptions): UseTableSpanReturn {
  const { columns, displayedRows } = options

  const hasColumnGroups = computed(() => {
    return columns.value.some(col => col.children?.length)
  })

  const maxDepth = computed(() => getMaxDepth(columns.value))

  const headerRows = computed<HeaderCell[][]>(() => {
    if (!hasColumnGroups.value) return []
    return buildHeaderRows(columns.value, maxDepth.value)
  })

  const leafColumns = computed<ColumnDef[]>(() => {
    return flattenLeaves(columns.value)
  })

  // --- Body rowSpan computation ---

  // Collect fields that have rowSpan: true
  const spanFields = computed(() => {
    return leafColumns.value
      .filter(col => col.rowSpan && col.field)
      .map(col => col.field!)
  })

  // Build span map: Map<`${index}:${field}`, spanSize>
  // spanSize > 1 = first row of group (render with rowspan attribute)
  // spanSize = 0 = swallowed by group above (hide cell)
  // spanSize = 1 = normal cell
  const spanMap = computed(() => {
    const map = new Map<string, number>()
    const fields = spanFields.value
    if (fields.length === 0) return map

    const rows = displayedRows.value

    for (const field of fields) {
      let i = 0
      while (i < rows.length) {
        const val = rows[i][field]
        let groupSize = 1

        // Count consecutive rows with same value
        while (i + groupSize < rows.length && rows[i + groupSize][field] === val) {
          groupSize++
        }

        if (groupSize > 1) {
          // First row gets the span count
          map.set(`${i}:${field}`, groupSize)
          // Subsequent rows get 0 (hidden)
          for (let j = 1; j < groupSize; j++) {
            map.set(`${i + j}:${field}`, 0)
          }
        }
        // groupSize === 1: not stored, getBodyRowSpan returns 1 by default

        i += groupSize
      }
    }

    return map
  })

  function getBodyRowSpan(_row: any, field: string, index: number): number {
    if (!spanFields.value.includes(field)) return 1
    return spanMap.value.get(`${index}:${field}`) ?? 1
  }

  /**
   * Get all row indices in the same merge group as the given index+field.
   * Used by edit flow to update all rows in a merged cell.
   */
  function getMergeGroupIndices(index: number, field: string): number[] {
    if (!spanFields.value.includes(field)) return [index]

    const span = spanMap.value.get(`${index}:${field}`)

    if (span === undefined || span === 1) {
      // Could be a swallowed row (span=0) -- find the group start
      let start = index
      while (start > 0 && spanMap.value.get(`${start}:${field}`) === 0) {
        start--
      }
      const groupSpan = spanMap.value.get(`${start}:${field}`)
      if (groupSpan && groupSpan > 1) {
        return Array.from({ length: groupSpan }, (_, i) => start + i)
      }
      return [index]
    }

    if (span === 0) {
      // Swallowed row -- find group start
      let start = index
      while (start > 0 && spanMap.value.get(`${start}:${field}`) === 0) {
        start--
      }
      const groupSpan = spanMap.value.get(`${start}:${field}`)
      if (groupSpan && groupSpan > 1) {
        return Array.from({ length: groupSpan }, (_, i) => start + i)
      }
      return [index]
    }

    // span > 1: this is the group start
    return Array.from({ length: span }, (_, i) => index + i)
  }

  return {
    headerRows,
    leafColumns,
    hasColumnGroups,
    getBodyRowSpan,
    getMergeGroupIndices,
    spanFields,
  }
}
