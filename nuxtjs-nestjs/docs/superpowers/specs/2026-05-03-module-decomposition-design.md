# Module Decomposition: user-management & program-management

## Goal

Split monolithic page files into small, focused components organized by concern (tables, dialogs, search). Use Pinia stores per module for shared state and cross-component coordination.

## Architecture

```
Page (thin shell) → imports components → components read/write module store
```

- Pages: layout only, no logic
- Stores: state, queries, mutations, cross-component coordination, table ref registry
- Components: UI rendering, local table ref concerns (validate, insertRow), delegates to store

## File Structure

### Components

```
app/components/modules/administration/
├── user-management/
│   ├── tables/
│   │   ├── UserTable.vue
│   │   └── index.ts
│   ├── search/
│   │   ├── UserSearchCard.vue
│   │   └── index.ts
│   └── index.ts
│
├── program-management/
│   ├── tables/
│   │   ├── ProgramTreeTable.vue
│   │   ├── PermissionTable.vue
│   │   └── index.ts
│   ├── dialogs/
│   │   ├── ProgramDialog.vue
│   │   └── index.ts
│   ├── search/
│   │   ├── ProgramSearchCard.vue
│   │   └── index.ts
│   └── index.ts
```

### Stores

```
app/stores/modules/
├── administration/
│   ├── useUserManagementStore.ts
│   ├── useProgramManagementStore.ts
│   └── index.ts
└── index.ts
```

### Barrel Export Pattern

Each subfolder has `index.ts`:
```ts
export { default as UserTable } from './UserTable.vue'
```

Module-level `index.ts` re-exports all subfolders:
```ts
export * from './tables'
export * from './search'
```

## Store Design

### useUserManagementStore

**State:**
- `searchForm` — reactive search values (searchText, useFlg)
- `rows: UserInfoDto[]`
- `totalRecords: number`
- `pagination: PageEvent`
- `sortState: SortEvent | null`
- `isLoading, isSaving: boolean`
- `tableRef: AppDataTableInstance | null`

**Actions:**
- `registerTable(ref)` — component registers its table ref
- `fetchData()` — enables query + refetch
- `handleSearch()` — reset pagination + fetchData
- `handlePage(event)` — update pagination + fetchData
- `handleSort(event)` — update sortState + fetchData
- `handleSave(changedRows)` — call mutation
- `handleAdd()` — `tableRef.insertRow({ useFlg: 'Y' })`
- `handleDelete()` — `tableRef.deleteSelected()`

**Queries (inside store):**
- `useLoadUsers` — reactive to requestBody computed
- `useSaveUsers` — mutation, onSuccess: clearChanges + refetch

### useProgramManagementStore

**State:**
- `searchForm` — reactive search values (pgmNm, pgmTpCd, useFlg)
- `programList: ProgramDto[]`
- `totalRecords: number`
- `selectedPgmId: string | undefined`
- `selectedProgramName: computed`
- `permRows: PermissionDto[]`
- `dialogVisible: boolean`
- `dialogMode: 'create' | 'edit'`
- `editingProgram: ProgramDto | null`
- `parentOptions: computed`
- `isLoadingTree, isLoadingPerms, isDialogSaving, isSavingPerms: boolean`
- `treeTableRef, permTableRef` — registered by components

**Actions:**
- `registerTreeTable(ref)` / `registerPermTable(ref)`
- `fetchData()` — check unsaved (via permTableRef.hasChanges), confirm dialog if needed, refetch + clearAll
- `handleSearch()` — fetchData
- `selectProgram(pgmId)` — set selectedPgmId, triggers permission load
- `openDialog(mode, program?)` — set dialog state
- `closeDialog()` — hide + reset form
- `saveDialog(values)` — insert or update mutation
- `deletePrograms(selected)` — delete mutation + clearAll
- `clearAll()` — cross-table coordination (clear selections, changes, reset selectedPgmId)
- `handleAddPermission()` — `permTableRef.insertRow(...)`
- `handleDeletePermission()` — `permTableRef.deleteSelected()`
- `handleSavePermissions(changedRows)` — mutation

**Queries (inside store):**
- `useLoadPrograms` — reactive to requestBody
- `useLoadPermissions` — reactive to selectedPgmId
- `useInsertProgram`, `useUpdateProgram`, `useDeletePrograms`, `useSavePermissions`

## Component Responsibilities

### UserSearchCard
- Renders SearchCard with search inputs
- Reads: `store.searchForm`
- Calls: `store.handleSearch()`

### UserTable
- Renders AppDataTable with toolbar (Add/Delete/Save buttons)
- Owns table ref, registers to store on mount
- Validate locally before save, passes changed rows to `store.handleSave()`
- Delegates pagination/sort events to store

### ProgramSearchCard
- Renders SearchCard with program search inputs
- Reads: `store.searchForm`
- Calls: `store.handleSearch()`

### ProgramTreeTable
- Renders AppTreeDataTable with toolbar (Add/Delete)
- Owns treeTableRef, registers to store
- Row click → `store.selectProgram(pgmId)`
- PgmCd click → `store.openDialog('edit', program)`
- Add → `store.openDialog('create')`
- Delete → `store.deletePrograms(selectedRows)`

### PermissionTable
- Renders permission AppDataTable with toolbar (Add/Delete/Save)
- Shows placeholder when no program selected
- Owns permTableRef, registers to store
- Validate locally, passes changed rows to `store.handleSavePermissions()`

### ProgramDialog
- Renders PDialog with form
- Reads: `store.dialogVisible`, `store.dialogMode`, `store.editingProgram`, `store.parentOptions`
- Owns dialogForm (useAppForm)
- Submit → `store.saveDialog(values)`
- Cancel → `store.closeDialog()`

## Page Files After Refactor

### user-management.vue
```vue
<script lang="ts" setup>
import { UserSearchCard, UserTable } from '~/components/modules/administration/user-management'
import { useUserManagementStore } from '~/stores/modules/administration'

const store = useUserManagementStore()
onMounted(() => store.fetchData())
</script>

<template>
  <div class="flex flex-col gap-2.5 pt-1">
    <UserSearchCard />
    <UserTable />
  </div>
</template>
```

### program-management.vue
```vue
<script lang="ts" setup>
import { ProgramSearchCard, ProgramTreeTable, PermissionTable } from '~/components/modules/administration/program-management'
import { ProgramDialog } from '~/components/modules/administration/program-management'
import { useProgramManagementStore } from '~/stores/modules/administration'

const store = useProgramManagementStore()
onMounted(() => store.fetchData())
</script>

<template>
  <div class="flex flex-col gap-2.5 pt-1">
    <ProgramSearchCard />
    <div class="grid grid-cols-2 gap-2.5">
      <ProgramTreeTable />
      <PermissionTable />
    </div>
    <ProgramDialog />
  </div>
</template>
```

## Constraints

- Nuxt auto-imports from `components/` — but nested `modules/` path requires explicit import or custom pathPrefix config
- Existing TanStack Query composables in `composables/modules/` remain unchanged — stores call them
- `useAppForm` stays per-component (dialog owns its form instance)
- Search form can live in store as plain reactive or use `useAppForm` — store approach simpler since no validation needed for search
- Table ref registration pattern: component calls `store.registerX(ref)` in `onMounted`, store nullifies in action if needed

## Migration Notes

- No breaking changes to existing composables/queries
- Pages shrink from 180/507 lines to ~15 lines each
- All business logic moves to stores
- All UI rendering moves to focused components
- Barrel exports enable clean imports
