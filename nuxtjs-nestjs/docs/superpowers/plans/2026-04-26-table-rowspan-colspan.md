# AppDataTable RowSpan & ColSpan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add header colSpan (grouped columns via `children`) and body rowSpan (auto-merge consecutive duplicates) to AppDataTable without breaking existing flat-column usage.

**Architecture:** Extend `ColumnDef` with optional `children` and `rowSpan` fields. New `useTableSpan` composable handles all tree-walking (header row generation) and body span computation. AppDataTable conditionally renders `PColumnGroup` headers when groups detected, otherwise renders identically to current behavior. Edit flow for merged cells writes to all rows in merge group.

**Tech Stack:** Vue 3 + PrimeVue DataTable (PColumnGroup/PRow/PColumn), TypeScript, Nuxt 3 composables

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `app/types/table.ts` | Modify | Make `field` optional, add `children`, `rowSpan` to ColumnDef |
| `app/composables/table/useTableSpan.ts` | Create | Header row generation, leaf column flattening, body span map |
| `app/composables/table/index.ts` | Modify | Export useTableSpan |
| `app/components/common/tables/AppDataTable.vue` | Modify | Conditional header rendering, wire useTableSpan, v-row-span directive |
| `app/composables/table/useTableEdit.ts` | Modify | Span-aware edit complete, skip hidden cells in navigation |
| `app/composables/table/useTableColumns.ts` | Modify | Accept leafColumns when groups present |
| `app/pages/index.vue` | Modify | Replace raw PColumnGroup demo with AppDataTable using children + rowSpan |

---

### Task 1: Extend ColumnDef Type

**Files:**
- Modify: `app/types/table.ts:18-35`

- [ ] **Step 1: Make `field` optional and add new fields**

In `app/types/table.ts`, replace the `ColumnDef` interface:

```ts
export interface ColumnDef {
  field?: string              // optional -- group nodes omit this
  header: string
  children?: ColumnDef[]      // nested sub-columns (group node)
  rowSpan?: boolean           // auto-merge consecutive duplicate values in body

  // Leaf-only props (ignored when children is present)
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

- [ ] **Step 2: Verify no TypeScript errors from making `field` optional**

Run: `cd /Users/admin/Desktop/Projects/Boilerplate/nuxtjs-nestjs/frontend && npx nuxi typecheck`

All existing code passes `field` on every ColumnDef, so no breakage expected. If there are errors from code that accesses `col.field` without null-checking, note them -- they'll be fixed in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add app/types/table.ts
git commit -m "feat(table): make ColumnDef.field optional, add children and rowSpan fields"
```

---

### Task 2: Create useTableSpan Composable -- Header Logic

**Files:**
- Create: `app/composables/table/useTableSpan.ts`

- [ ] **Step 1: Create the file with types and header tree-walking**

Create `app/composables/table/useTableSpan.ts`:

```ts
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
  rowKey: Ref<string>
}

export interface UseTableSpanReturn {
  headerRows: ComputedRef<HeaderCell[][]>
  leafColumns: ComputedRef<ColumnDef[]>
  hasColumnGroups: ComputedRef<boolean>
  getBodyRowSpan: (row: any, field: string, index: number) => number
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
      leaves.push(...flattenLeaves(col.children))
    } else {
      leaves.push(col)
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
        rows[depth].push({
          header: col.header,
          colspan: countLeaves(col),
          rowspan: 1,
        })
        walk(col.children, depth + 1)
      } else {
        // Leaf node: placed at current depth, spans remaining rows
        rows[depth].push({
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
  const { columns, displayedRows, rowKey } = options

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

  // Body rowSpan is added in Task 3
  function getBodyRowSpan(_row: any, _field: string, _index: number): number {
    return 1
  }

  return {
    headerRows,
    leafColumns,
    hasColumnGroups,
    getBodyRowSpan,
  }
}
```

- [ ] **Step 2: Export from index**

In `app/composables/table/index.ts`, add these two lines:

After the existing `useTableProcFlag` export line:
```ts
export { useTableSpan } from './useTableSpan'
```

After the existing `UseTableProcFlagReturn` type export line:
```ts
export type { UseTableSpanReturn } from './useTableSpan'
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `cd /Users/admin/Desktop/Projects/Boilerplate/nuxtjs-nestjs/frontend && npx nuxi typecheck`

- [ ] **Step 4: Commit**

```bash
git add app/composables/table/useTableSpan.ts app/composables/table/index.ts
git commit -m "feat(table): add useTableSpan composable with header row generation"
```

---

### Task 3: Add Body RowSpan Logic to useTableSpan

**Files:**
- Modify: `app/composables/table/useTableSpan.ts`

- [ ] **Step 1: Replace the placeholder `getBodyRowSpan` with real implementation**

In `useTableSpan`, replace the `getBodyRowSpan` placeholder and add the span map computation. Replace from `// Body rowSpan is added in Task 3` through the end of `useTableSpan` function:

```ts
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
      // Walk backward to find the first row of the group
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
```

- [ ] **Step 2: Update the return type**

Update `UseTableSpanReturn` interface to include the new members:

```ts
export interface UseTableSpanReturn {
  headerRows: ComputedRef<HeaderCell[][]>
  leafColumns: ComputedRef<ColumnDef[]>
  hasColumnGroups: ComputedRef<boolean>
  getBodyRowSpan: (row: any, field: string, index: number) => number
  getMergeGroupIndices: (index: number, field: string) => number[]
  spanFields: ComputedRef<string[]>
}
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `cd /Users/admin/Desktop/Projects/Boilerplate/nuxtjs-nestjs/frontend && npx nuxi typecheck`

- [ ] **Step 4: Commit**

```bash
git add app/composables/table/useTableSpan.ts
git commit -m "feat(table): add body rowSpan computation to useTableSpan"
```

---

### Task 4: Wire useTableSpan into AppDataTable -- Header Rendering

**Files:**
- Modify: `app/components/common/tables/AppDataTable.vue`

- [ ] **Step 1: Import useTableSpan and wire it up**

In `AppDataTable.vue`, add `useTableSpan` to the import from `~/composables/table`:

```ts
import {
  useTableColumns,
  useTableSort,
  useTablePagination,
  useTableSelection,
  useTableEdit,
  useTableFooter,
  useTableExport,
  useTableMenus,
  useTableProcFlag,
  useTableSpan,
  generateTempKey,
} from '~/composables/table'
```

After the `pagination` composable wiring (after line ~128), add:

```ts
const span = useTableSpan({
  columns: columnsRef,
  displayedRows: pagination.displayedRows,
  rowKey: rowKeyRef,
})
```

- [ ] **Step 2: Update useTableColumns to use leafColumns when groups are present**

In AppDataTable.vue, the `columns` composable is initialized at line ~101. After it, add a computed that provides the effective visible columns for body rendering:

```ts
// When column groups exist, body columns come from span.leafColumns (flattened tree).
// Otherwise, use columns.visibleColumns (existing behavior).
const bodyColumns = computed(() => {
  if (span.hasColumnGroups.value) {
    return span.leafColumns.value.filter(col => !col.hidden)
  }
  return columns.visibleColumns.value
})
```

- [ ] **Step 3: Add conditional header rendering in template**

In the template, replace the existing `<!-- Data columns -->` PColumn block and the checkbox column. The full `<PDataTable>` inner content becomes:

Find this block (lines ~359-486, inside `<PDataTable>`):

```vue
        <!-- Empty slot -->
        <template #empty>
          ...
        </template>

        <!-- Checkbox column for checkbox selection -->
        <PColumn
          v-if="selectable && selectionMode === 'checkbox'"
          ...
        />

        <!-- Data columns -->
        <PColumn
          v-for="col in columns.visibleColumns.value"
          ...
        >
```

Replace with:

```vue
        <!-- Empty slot -->
        <template #empty>
          <slot name="empty">
            <div class="text-center py-8 text-surface-400">
              {{ $t('table.noData') }}
            </div>
          </slot>
        </template>

        <!-- === Grouped header mode (PColumnGroup) === -->
        <template v-if="span.hasColumnGroups.value">
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
                :sortable="cell.col ? cell.col.sortable !== false : false"
                :field="cell.field"
                :frozen="cell.col?.frozen"
                :style="{
                  ...(cell.col ? {
                    width: (cell.col.width ?? defaultColumnWidth) + 'px',
                    minWidth: (cell.col.minWidth ?? 80) + 'px',
                    textAlign: cell.col.align ?? 'left',
                  } : { textAlign: 'center' }),
                  ...(cell.col?.frozen ? { borderRight: '0.5px solid var(--p-datatable-body-cell-border-color)' } : {}),
                }"
              />
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
            ...(col.frozen ? { borderRight: '0.5px solid var(--p-datatable-body-cell-border-color)' } : {}),
          }"
        >
          <!-- Header (flat mode only -- grouped mode uses PColumnGroup above) -->
          <template v-if="!span.hasColumnGroups.value" #header>
            <div
              class="flex items-center gap-1 w-full font-bold"
              @contextmenu.prevent="menus.onHeaderContextMenu($event, col)"
            >
              <slot :name="`header-${col.field}`" :column="col">
                {{ col.header }}
              </slot>
            </div>
          </template>
```

Keep the existing `#body`, `#editor`, and `#footer` templates unchanged inside `<PColumn>` -- they already use `col.field` which works for leaf columns.

- [ ] **Step 4: Verify the app builds**

Run: `cd /Users/admin/Desktop/Projects/Boilerplate/nuxtjs-nestjs/frontend && npx nuxi build`

- [ ] **Step 5: Commit**

```bash
git add app/components/common/tables/AppDataTable.vue
git commit -m "feat(table): wire useTableSpan with conditional PColumnGroup header rendering"
```

---

### Task 5: Add v-row-span Directive for Body RowSpan

**Files:**
- Modify: `app/components/common/tables/AppDataTable.vue`

- [ ] **Step 1: Define the directive inside AppDataTable.vue**

In the `<script setup>` section of `AppDataTable.vue`, add the directive definition (after the imports, before `const props`):

```ts
// Custom directive to set rowspan on parent <td> element.
// PrimeVue controls <td> creation; this directive is placed on the inner div.
// value > 1: set td.rowSpan = value
// value = 0: hide td (swallowed by merge above)
// value = 1: normal cell (no-op)
const vRowSpan = {
  mounted(el: HTMLElement, binding: { value: number }) {
    applyRowSpan(el, binding.value)
  },
  updated(el: HTMLElement, binding: { value: number }) {
    applyRowSpan(el, binding.value)
  },
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
```

- [ ] **Step 2: Apply the directive in the body template**

In the `#body` template of the data columns `<PColumn>`, wrap the existing `<div class="cell-content relative">` with the directive:

Find:
```vue
          <template #body="{ data, index }">
            <div :data-field="col.field" class="cell-content relative">
```

Replace with:
```vue
          <template #body="{ data, index }">
            <div
              :data-field="col.field"
              class="cell-content relative"
              v-row-span="col.rowSpan ? span.getBodyRowSpan(data, col.field!, index) : 1"
            >
```

- [ ] **Step 3: Verify the app builds**

Run: `cd /Users/admin/Desktop/Projects/Boilerplate/nuxtjs-nestjs/frontend && npx nuxi build`

- [ ] **Step 4: Commit**

```bash
git add app/components/common/tables/AppDataTable.vue
git commit -m "feat(table): add v-row-span directive for body cell merging"
```

---

### Task 6: Span-Aware Cell Editing in useTableEdit

**Files:**
- Modify: `app/composables/table/useTableEdit.ts`

- [ ] **Step 1: Add span context to useTableEdit options**

In `app/composables/table/useTableEdit.ts`, add span-related fields to the options interface:

```ts
export interface UseTableEditOptions {
  editable: Ref<boolean | undefined>
  editableColumns: Ref<string[] | undefined>
  columnState: ColumnDef[]
  visibleColumns: Ref<ColumnDef[]>
  rows: Ref<any[]>
  displayedRows: Ref<any[]>
  rowKey: Ref<string>
  cellConfig: Ref<((row: any, field: string) => CellConfig | void) | undefined>
  dataTableRef: Ref<any>
  emit: {
    editSave: (payload: EditSaveEvent) => void
  }
  // Span support (optional -- undefined when no span active)
  getBodyRowSpan?: (row: any, field: string, index: number) => number
  getMergeGroupIndices?: (index: number, field: string) => number[]
}
```

Destructure the new fields at the top of the function:

```ts
  const {
    editable,
    editableColumns,
    columnState,
    visibleColumns,
    rows,
    displayedRows,
    rowKey,
    cellConfig,
    dataTableRef,
    emit,
    getBodyRowSpan,
    getMergeGroupIndices,
  } = options
```

- [ ] **Step 2: Modify onCellEditComplete for span-aware editing**

Replace the `onCellEditComplete` function:

```ts
  function onCellEditComplete(event: any) {
    const { data, newData, field } = event
    const oldRow = JSON.parse(JSON.stringify(data))
    const key = data[rowKey.value]

    // Merge last editor-emitted value if PrimeVue's editingMeta missed it
    if (lastEditorValue && lastEditorValue.field === field) {
      newData[field] = lastEditorValue.value
    }
    lastEditorValue = null

    Object.assign(data, newData)
    dirtyRows.value.add(key)

    // If this field is part of a rowSpan merge group, update all rows in the group
    if (getMergeGroupIndices && getBodyRowSpan) {
      const index = displayedRows.value.indexOf(data)
      if (index !== -1) {
        const col = visibleColumns.value.find(c => c.field === field)
        if (col?.rowSpan) {
          const groupIndices = getMergeGroupIndices(index, field)
          for (const gi of groupIndices) {
            if (gi === index) continue // already updated above
            const groupRow = displayedRows.value[gi]
            if (!groupRow) continue
            groupRow[field] = newData[field]
            const groupKey = groupRow[rowKey.value]
            dirtyRows.value.add(groupKey)
            emit.editSave({
              oldRow: JSON.parse(JSON.stringify({ ...groupRow, [field]: oldRow[field] })),
              newRow: { ...groupRow },
              field,
            })
          }
        }
      }
    }

    emit.editSave({
      oldRow,
      newRow: { ...data },
      field,
    })
  }
```

- [ ] **Step 3: Modify onInlineToggle for span-aware editing**

Replace the `onInlineToggle` function:

```ts
  function onInlineToggle(row: any, field: string, val: any) {
    const oldRow = JSON.parse(JSON.stringify(row))
    row[field] = val
    const key = row[rowKey.value]
    dirtyRows.value.add(key)

    // If this field is part of a rowSpan merge group, update all rows in the group
    if (getMergeGroupIndices && getBodyRowSpan) {
      const index = displayedRows.value.indexOf(row)
      if (index !== -1) {
        const col = visibleColumns.value.find(c => c.field === field)
        if (col?.rowSpan) {
          const groupIndices = getMergeGroupIndices(index, field)
          for (const gi of groupIndices) {
            if (gi === index) continue
            const groupRow = displayedRows.value[gi]
            if (!groupRow) continue
            groupRow[field] = val
            const groupKey = groupRow[rowKey.value]
            dirtyRows.value.add(groupKey)
            emit.editSave({
              oldRow: JSON.parse(JSON.stringify({ ...groupRow, [field]: oldRow[field] })),
              newRow: { ...groupRow },
              field,
            })
          }
        }
      }
    }

    emit.editSave({
      oldRow,
      newRow: { ...row },
      field,
    })
  }
```

- [ ] **Step 4: Modify `move` function to skip hidden (span=0) cells**

In the `move` function, after computing the target `row` and `col` position and before calling `activateCell`, add a span skip check. Replace the section after the switch statement (after `targetField` is determined):

```ts
    const targetField = grid[row]?.[col]
    if (!targetField) return
    const targetRow = displayedRows.value[row]

    // Skip cells hidden by rowSpan merge (span = 0)
    if (getBodyRowSpan && targetField) {
      const spanVal = getBodyRowSpan(targetRow, targetField, row)
      if (spanVal === 0) {
        activeCell.value = { rowIndex: row, field: targetField }
        move(direction, depth + 1)
        return
      }
    }

    if (isCellDisabled(targetRow, targetField)) {
      activeCell.value = { rowIndex: row, field: targetField }
      move(direction, depth + 1)
      return
    }

    activateCell(row, targetField)
```

- [ ] **Step 5: Verify no TypeScript errors**

Run: `cd /Users/admin/Desktop/Projects/Boilerplate/nuxtjs-nestjs/frontend && npx nuxi typecheck`

- [ ] **Step 6: Commit**

```bash
git add app/composables/table/useTableEdit.ts
git commit -m "feat(table): span-aware cell editing and keyboard navigation"
```

---

### Task 7: Pass Span Functions to useTableEdit in AppDataTable

**Files:**
- Modify: `app/components/common/tables/AppDataTable.vue`

- [ ] **Step 1: Update the useTableEdit wiring to pass span functions**

In `AppDataTable.vue`, find the `useTableEdit` call (lines ~139-152):

```ts
const edit = useTableEdit({
  editable: editableRef,
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
  },
})
```

Replace with:

```ts
const edit = useTableEdit({
  editable: editableRef,
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
  },
  getBodyRowSpan: span.getBodyRowSpan,
  getMergeGroupIndices: span.getMergeGroupIndices,
})
```

**Important:** The `span` composable must be wired BEFORE `edit`. Move the `span` wiring block (from Task 4) above the `edit` wiring block. The order should be:

1. `columns` (useTableColumns)
2. `sort` (useTableSort)
3. `pagination` (useTablePagination)
4. `span` (useTableSpan) -- **moved here**
5. `selection` (useTableSelection)
6. `bodyColumns` computed
7. `edit` (useTableEdit) -- now receives span functions

- [ ] **Step 2: Verify the app builds**

Run: `cd /Users/admin/Desktop/Projects/Boilerplate/nuxtjs-nestjs/frontend && npx nuxi build`

- [ ] **Step 3: Commit**

```bash
git add app/components/common/tables/AppDataTable.vue
git commit -m "feat(table): pass span functions to useTableEdit for merge-aware editing"
```

---

### Task 8: Update useTableColumns for Leaf Column Awareness

**Files:**
- Modify: `app/composables/table/useTableColumns.ts`

- [ ] **Step 1: Handle optional `field` in column processing**

In `useTableColumns.ts`, the code accesses `col.field` in several places. Since `field` is now optional (group nodes have no field), add guards. These group nodes should never appear in `columnState` since `columnState` should only contain leaf columns. But to be safe, find these locations and add null checks:

In `toggleColumnVisibility`:
```ts
  function toggleColumnVisibility(field: string) {
    const idx = columnState.findIndex(c => c.field === field)
```
No change needed -- `findIndex` with `===` comparison will simply not match if `c.field` is undefined.

In `syncFrozenToState`:
```ts
  function syncFrozenToState() {
    for (let i = 0; i < columnState.length; i++) {
      const shouldBeFrozen = frozenFields.value.has(columnState[i]!.field!)
```
Add non-null assertion or guard:
```ts
  function syncFrozenToState() {
    for (let i = 0; i < columnState.length; i++) {
      const colField = columnState[i]!.field
      if (!colField) continue
      const shouldBeFrozen = frozenFields.value.has(colField)
      if (columnState[i]!.frozen !== shouldBeFrozen) {
        columnState[i] = { ...columnState[i]!, frozen: shouldBeFrozen }
      }
    }
  }
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd /Users/admin/Desktop/Projects/Boilerplate/nuxtjs-nestjs/frontend && npx nuxi typecheck`

- [ ] **Step 3: Commit**

```bash
git add app/composables/table/useTableColumns.ts
git commit -m "fix(table): guard optional field access in useTableColumns for group nodes"
```

---

### Task 9: Update Index Page Demo -- Replace Raw PColumnGroup with AppDataTable

**Files:**
- Modify: `app/pages/index.vue`

- [ ] **Step 1: Add column definitions using children and rowSpan**

In `app/pages/index.vue`, replace the existing `salesData` section (lines ~124-153) and add column definitions. Keep `salesData` ref and `salesTotals` computed, but add:

```ts
// --- Column Span demo using AppDataTable children ---
const salesColumns: ColumnDef[] = [
  { field: 'id', header: '#', width: 60, align: 'center' },
  { field: 'product', header: 'Product', width: 140 },
  {
    header: 'Q1',
    children: [
      { field: 'q1Revenue', header: 'Revenue', width: 110, align: 'right', format: (val) => fmtCurrency(val) },
      { field: 'q1Units', header: 'Units', width: 80, align: 'right' },
    ],
  },
  {
    header: 'Q2',
    children: [
      { field: 'q2Revenue', header: 'Revenue', width: 110, align: 'right', format: (val) => fmtCurrency(val) },
      { field: 'q2Units', header: 'Units', width: 80, align: 'right' },
    ],
  },
  {
    header: 'Q3',
    children: [
      { field: 'q3Revenue', header: 'Revenue', width: 110, align: 'right', format: (val) => fmtCurrency(val) },
      { field: 'q3Units', header: 'Units', width: 80, align: 'right' },
    ],
  },
  {
    header: 'Q4',
    children: [
      { field: 'q4Revenue', header: 'Revenue', width: 110, align: 'right', format: (val) => fmtCurrency(val) },
      { field: 'q4Units', header: 'Units', width: 80, align: 'right' },
    ],
  },
]

// --- RowSpan demo data ---
const rowSpanData = ref([
  { id: 1, department: 'Engineering', team: 'Frontend', name: 'Alice', salary: 85000 },
  { id: 2, department: 'Engineering', team: 'Frontend', name: 'Bob', salary: 78000 },
  { id: 3, department: 'Engineering', team: 'Backend', name: 'Carol', salary: 92000 },
  { id: 4, department: 'Engineering', team: 'Backend', name: 'Dave', salary: 88000 },
  { id: 5, department: 'Sales', team: 'Enterprise', name: 'Eve', salary: 72000 },
  { id: 6, department: 'Sales', team: 'Enterprise', name: 'Frank', salary: 68000 },
  { id: 7, department: 'Sales', team: 'SMB', name: 'Grace', salary: 65000 },
  { id: 8, department: 'HR', team: 'Recruiting', name: 'Hank', salary: 70000 },
  { id: 9, department: 'HR', team: 'Recruiting', name: 'Iris', salary: 67000 },
])

const rowSpanColumns: ColumnDef[] = [
  { field: 'department', header: 'Department', width: 140, rowSpan: true },
  { field: 'team', header: 'Team', width: 120, rowSpan: true },
  { field: 'name', header: 'Name', width: 150, editable: true, editType: 'input' },
  { field: 'salary', header: 'Salary', width: 120, align: 'right', editable: true, editType: 'number', format: (val) => val != null ? `$${Number(val).toLocaleString()}` : '' },
]
```

- [ ] **Step 2: Replace the PColumnGroup template with AppDataTable**

Find the `<!-- ColumnSpan Demo (PColumnGroup) -->` PCard block (lines ~576-647) and replace entirely:

```vue
      <!-- Column Groups Demo (AppDataTable children) -->
      <PCard>
        <template #title>
          <span class="text-base">Grouped Headers Demo (children)</span>
        </template>
        <template #content>
          <AppDataTable
            :rows="salesData"
            :columns="salesColumns"
            table-height="400px"
            data-mode="pagination"
            :page-size="10"
            pagination-mode="client"
            sort-backend="client"
          />
        </template>
      </PCard>

      <!-- RowSpan Demo -->
      <PCard>
        <template #title>
          <span class="text-base">RowSpan Demo (auto-merge)</span>
        </template>
        <template #content>
          <AppDataTable
            :rows="rowSpanData"
            :columns="rowSpanColumns"
            :editable="true"
            :show-gridlines="true"
            pagination-mode="client"
            sort-backend="client"
            @row-edit-save="logTableEvent('rowspan-edit', $event)"
          />
        </template>
      </PCard>
```

- [ ] **Step 3: Verify the app builds and renders correctly**

Run: `cd /Users/admin/Desktop/Projects/Boilerplate/nuxtjs-nestjs/frontend && npx nuxi build`

Then start dev server and visually verify:
- Grouped headers show multi-row header with Q1/Q2/Q3/Q4 spanning Revenue+Units
- RowSpan demo shows Department and Team cells merged for consecutive duplicates
- Editing a merged cell updates all rows in the group
- Existing AppDataTable demo (employees) is completely unaffected

- [ ] **Step 4: Commit**

```bash
git add app/pages/index.vue
git commit -m "feat(table): replace raw PColumnGroup demo with AppDataTable children + rowSpan demos"
```

---

### Task 10: Handle Edge Cases and Cleanup

**Files:**
- Modify: `app/components/common/tables/AppDataTable.vue`
- Modify: `app/composables/table/useTableSpan.ts`

- [ ] **Step 1: Add virtual scroll + rowSpan warning**

In `AppDataTable.vue`, after the `span` composable wiring, add:

```ts
// Warn if virtual scroll + rowSpan used together (unsupported)
if (import.meta.dev) {
  watch([virtualScrollRef, span.spanFields], ([vs, fields]) => {
    if (vs && fields.length > 0) {
      console.warn('[AppDataTable] rowSpan is not supported with virtual scroll. Row merging will not work correctly with recycled DOM rows.')
    }
  }, { immediate: true })
}
```

- [ ] **Step 2: Add group + field validation warning**

In `useTableSpan.ts`, inside `flattenLeaves`, add dev-mode validation:

```ts
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
```

- [ ] **Step 3: Add CSS for merged cell borders**

In `AppDataTable.vue` `<style scoped>` section, add styles for rowSpan cells:

```css
/* Merged rowSpan cells: add bottom border only on the last row of the group */
:deep(td[rowspan]) {
  vertical-align: middle;
}
```

- [ ] **Step 4: Verify the app builds**

Run: `cd /Users/admin/Desktop/Projects/Boilerplate/nuxtjs-nestjs/frontend && npx nuxi build`

- [ ] **Step 5: Commit**

```bash
git add app/components/common/tables/AppDataTable.vue app/composables/table/useTableSpan.ts
git commit -m "feat(table): add edge case warnings and merged cell styling"
```

---

## Summary of Changes

| Task | What | Files |
|------|------|-------|
| 1 | Extend ColumnDef type | types/table.ts |
| 2 | Create useTableSpan -- header logic | composables/table/useTableSpan.ts, index.ts |
| 3 | Add body rowSpan logic | composables/table/useTableSpan.ts |
| 4 | Wire header rendering | AppDataTable.vue |
| 5 | Add v-row-span directive | AppDataTable.vue |
| 6 | Span-aware editing | useTableEdit.ts |
| 7 | Connect span to edit | AppDataTable.vue |
| 8 | Guard optional field | useTableColumns.ts |
| 9 | Demo page update | index.vue |
| 10 | Edge cases + cleanup | AppDataTable.vue, useTableSpan.ts |
