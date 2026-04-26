# AppDataTable: RowSpan & ColSpan Support

**Date:** 2026-04-26
**Status:** Approved
**Approach:** C -- Recursive ColumnDef with useTableSpan composable

## Goal

Add rowSpan (body) and colSpan (header) support to AppDataTable without impacting existing flat-column usage. Developers define grouped headers via `children` on ColumnDef, and auto-merge body rows via `rowSpan: true`.

## Decisions

| Question | Decision |
|----------|----------|
| Header grouping API | `children: ColumnDef[]` on ColumnDef (nested) |
| Row merge opt-in | `rowSpan: true` on ColumnDef (per-column, build-time) |
| Runtime toggle | Not needed -- developer specifies at build time |
| Nesting depth | Recursive -- any depth supported |
| Header rowSpan for flat columns | Auto-calculated from max tree depth |
| Editable + rowSpan | Edit merged cell updates ALL rows in merge group |
| Approach | Single recursive ColumnDef type + new useTableSpan composable |

## Type Changes

### ColumnDef (types/table.ts)

Two new optional fields added:

```ts
export interface ColumnDef {
  field?: string              // optional -- group nodes omit this
  header: string
  children?: ColumnDef[]      // nested sub-columns (makes this a group node)
  rowSpan?: boolean           // auto-merge consecutive duplicate values in body

  // Existing leaf-only props (unchanged, ignored on group nodes)
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
```

**Rules:**
- `children` present = group node (no `field`)
- `field` present = leaf node (no `children`)
- Both present = runtime console warning, treated as group
- Neither present = invalid, skipped

**Backward compatibility:** `field` changes from required to optional. All existing definitions have `field` + no `children` = leaf = identical behavior.

## New Composable: useTableSpan

**File:** `composables/table/useTableSpan.ts`

### Types

```ts
interface HeaderCell {
  header: string
  colspan: number        // leaf columns spanned
  rowspan: number        // header rows spanned
  col?: ColumnDef        // present only for leaf cells
  field?: string         // present only for leaf cells
}

interface UseTableSpanOptions {
  columns: Ref<ColumnDef[]>
  displayedRows: Ref<any[]>
  rowKey: Ref<string>
}

interface UseTableSpanReturn {
  headerRows: ComputedRef<HeaderCell[][]>
  leafColumns: ComputedRef<ColumnDef[]>
  hasColumnGroups: ComputedRef<boolean>
  getBodyRowSpan: (row: any, field: string, index: number) => number
}
```

### Header Row Generation

1. Walk column tree to find `maxDepth` (1 for flat, 2+ for nested)
2. Build `headerRows[0..maxDepth-1]`:
   - Group nodes placed at their depth level with `colspan = leafCount(node)`
   - Leaf nodes placed at their depth level with `rowspan = maxDepth - currentDepth`
3. `leafColumns` = depth-first flatten of tree, preserving left-to-right order
4. `hasColumnGroups` = `maxDepth > 1`

### Body RowSpan Computation

For columns with `rowSpan: true`:

1. Scan `displayedRows` sequentially
2. Group consecutive rows where `row[field]` values are equal
3. Build span map: `Map<string, number>` keyed by `${index}:${field}`
   - First row in group: value = group size (e.g., 3)
   - Subsequent rows in group: value = 0 (hidden)
   - Non-spannable columns: value = 1
4. Recomputed reactively when `displayedRows` changes
5. Rows with procFlag `'D'` excluded from span groups

`getBodyRowSpan(row, field, index)` returns:
- `> 1`: first row of merge group, render `<td>` with this rowspan
- `0`: swallowed by merge above, hide `<td>`
- `1`: normal cell, no merge

## Template Changes (AppDataTable.vue)

### Conditional Header Rendering

When `hasColumnGroups = false`: exact current flat PColumn loop (unchanged).

When `hasColumnGroups = true`:

```vue
<PColumnGroup type="header">
  <PRow v-for="(hRow, ri) in span.headerRows.value" :key="ri">
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
      :header="cell.header"
      :colspan="cell.colspan > 1 ? cell.colspan : undefined"
      :rowspan="cell.rowspan > 1 ? cell.rowspan : undefined"
      :sortable="cell.col?.sortable !== false"
      :field="cell.col?.field"
      :frozen="cell.col?.frozen"
    />
  </PRow>
</PColumnGroup>
```

### Body Column Source

When groups present, body `PColumn` loop uses `span.leafColumns` instead of `columns.visibleColumns`. Both produce same result for flat columns.

### Body RowSpan via Custom Directive

`v-row-span` directive on `<td>`:
- Sets `el.rowSpan = N` when span > 1
- Sets `el.style.display = 'none'` when span = 0
- No-op when span = 1

Applied in body template:

```vue
<template #body="{ data, index }">
  <div
    v-row-span="col.rowSpan ? span.getBodyRowSpan(data, col.field!, index) : 1"
    class="cell-content relative"
  >
    <!-- existing cell rendering -->
  </div>
</template>
```

Note: PrimeVue renders body template content inside a `<td>` element it controls. The directive is placed on the inner `<div>` but must manipulate the parent `<td>` via `el.parentElement` to set `rowSpan` attribute and `display: none`. The directive's `mounted` and `updated` hooks both handle this. When span = 0, `td.style.display = 'none'` hides the entire cell. When span > 1, `td.rowSpan = N`.

## Edit Flow for Merged Cells

### onCellEditComplete (modified in useTableEdit)

When column has `rowSpan: true`:

1. Detect merge group via `useTableSpan` span map
2. Find all rows in group from `displayedRows[startIndex..startIndex+spanSize-1]`
3. Write new value to `row[field]` for each row
4. Mark procFlag for each row:
   - 'I' rows stay 'I'
   - 'S' rows become 'U'
5. Emit `row-edit-save` once per affected row

### Keyboard Navigation (handleKeyDown)

Tab/Arrow navigation skips cells with rowSpan = 0 (hidden cells). Jumps to next visible cell.

### procFlag Interaction

- Deleted rows ('D') excluded from span computation
- Editing merged cell preserves insert flags ('I' stays 'I')
- All non-insert rows in group marked 'U'

## Files Changed

| File | Change |
|------|--------|
| `types/table.ts` | `field` optional, add `children`, `rowSpan` to ColumnDef |
| `composables/table/useTableSpan.ts` | **New** -- header rows, leaf columns, body span map |
| `composables/table/index.ts` | Export useTableSpan |
| `components/common/tables/AppDataTable.vue` | Conditional header rendering, directive, wire useTableSpan |
| `composables/table/useTableEdit.ts` | Span-aware edit complete, skip hidden cells in navigation |
| `composables/table/useTableColumns.ts` | Process leafColumns when groups present |

## Files NOT Changed

- `useTableSort.ts` -- sorts by field, unaffected
- `useTablePagination.ts` -- row slicing, unaffected
- `useTableSelection.ts` -- row selection, unaffected
- `useTableFooter.ts` -- aggregation on leaf fields, unaffected
- `useTableExport.ts` -- exports leaf columns, unaffected
- `useTableMenus.ts` -- operates on column state, unaffected
- `useTableProcFlag.ts` -- flag tracking, unaffected
- `useAppDataTable.ts` -- ref proxy, unaffected

## Developer API Examples

### Grouped Headers Only

```ts
const columns: ColumnDef[] = [
  { field: 'id', header: 'ID' },
  {
    header: 'Q1',
    children: [
      { field: 'q1Revenue', header: 'Revenue', editType: 'number', editable: true },
      { field: 'q1Units', header: 'Units' },
    ],
  },
  {
    header: 'Q2',
    children: [
      { field: 'q2Revenue', header: 'Revenue' },
      { field: 'q2Units', header: 'Units' },
    ],
  },
]
```

### Body RowSpan Only

```ts
const columns: ColumnDef[] = [
  { field: 'department', header: 'Department', rowSpan: true },
  { field: 'name', header: 'Name', editable: true, editType: 'input' },
  { field: 'salary', header: 'Salary', editable: true, editType: 'number' },
]

// Data sorted by department for merge to work
const rows = [
  { id: 1, department: 'Engineering', name: 'Alice', salary: 80000 },
  { id: 2, department: 'Engineering', name: 'Bob', salary: 75000 },
  { id: 3, department: 'Sales', name: 'Dave', salary: 60000 },
  { id: 4, department: 'Sales', name: 'Eve', salary: 65000 },
]
```

### Combined

```ts
const columns: ColumnDef[] = [
  { field: 'region', header: 'Region', rowSpan: true },
  { field: 'product', header: 'Product' },
  {
    header: 'Financials',
    children: [
      { field: 'revenue', header: 'Revenue', editable: true, editType: 'number' },
      { field: 'cost', header: 'Cost' },
    ],
  },
]
```

### Deep Nesting

```ts
const columns: ColumnDef[] = [
  { field: 'id', header: '#' },
  {
    header: '2024',
    children: [
      {
        header: 'H1',
        children: [
          { field: 'q1', header: 'Q1' },
          { field: 'q2', header: 'Q2' },
        ],
      },
      {
        header: 'H2',
        children: [
          { field: 'q3', header: 'Q3' },
          { field: 'q4', header: 'Q4' },
        ],
      },
    ],
  },
]
// Renders 3 header rows:
// | #       | 2024                        |
// | (spans) | H1          | H2            |
// | (spans) | Q1   | Q2   | Q3     | Q4  |
```

## Constraints

- Data MUST be sorted by spannable column for rowSpan to produce correct merges. Component does not auto-sort.
- rowSpan computation runs on `displayedRows` (current page), not full dataset.
- Virtual scroll + rowSpan: not supported in initial implementation. rowSpan requires real DOM rows; virtual scroll recycles them. Console warning if both detected.
