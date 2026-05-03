# Module Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split user-management.vue (180 lines) and program-management.vue (507 lines) into focused components communicating through Pinia stores.

**Architecture:** Each page becomes a thin shell importing components. Components read/write a module Pinia store. Stores own queries, mutations, table refs, and all shared state. Components register their table refs to the store for cross-component coordination.

**Tech Stack:** Vue 3 Composition API, Pinia (defineStore composition), TanStack Query (via existing useAppQuery/useAppMutation wrappers), Zod, PrimeVue

---

## File Map

### New Files

| Path | Responsibility |
|------|---------------|
| `app/stores/modules/administration/useUserManagementStore.ts` | User module state, queries, actions |
| `app/stores/modules/administration/useProgramManagementStore.ts` | Program module state, queries, actions |
| `app/stores/modules/administration/index.ts` | Barrel export |
| `app/stores/modules/index.ts` | Barrel export |
| `app/components/modules/administration/user-management/search/UserSearchCard.vue` | Search form |
| `app/components/modules/administration/user-management/search/index.ts` | Barrel |
| `app/components/modules/administration/user-management/tables/UserTable.vue` | Editable table + toolbar |
| `app/components/modules/administration/user-management/tables/index.ts` | Barrel |
| `app/components/modules/administration/user-management/index.ts` | Module barrel |
| `app/components/modules/administration/program-management/search/ProgramSearchCard.vue` | Search form |
| `app/components/modules/administration/program-management/search/index.ts` | Barrel |
| `app/components/modules/administration/program-management/tables/ProgramTreeTable.vue` | Tree table + toolbar |
| `app/components/modules/administration/program-management/tables/PermissionTable.vue` | Permission editable table + toolbar |
| `app/components/modules/administration/program-management/tables/index.ts` | Barrel |
| `app/components/modules/administration/program-management/dialogs/ProgramDialog.vue` | Create/edit dialog |
| `app/components/modules/administration/program-management/dialogs/index.ts` | Barrel |
| `app/components/modules/administration/program-management/index.ts` | Module barrel |

### Modified Files

| Path | Change |
|------|--------|
| `app/pages/administration/user-management.vue` | Replace with thin shell |
| `app/pages/administration/program-management.vue` | Replace with thin shell |
| `app/stores/index.ts` | Add modules re-export |

---

## Task 1: Store Infrastructure (barrels + index files)

**Files:**
- Create: `app/stores/modules/index.ts`
- Create: `app/stores/modules/administration/index.ts`
- Modify: `app/stores/index.ts`

- [ ] **Step 1: Create stores/modules/administration/index.ts**

```ts
export { useUserManagementStore } from './useUserManagementStore'
export { useProgramManagementStore } from './useProgramManagementStore'
```

- [ ] **Step 2: Create stores/modules/index.ts**

```ts
export * from './administration'
```

- [ ] **Step 3: Update stores/index.ts**

```ts
export * from './common';
export * from './modules';
```

- [ ] **Step 4: Commit**

```bash
git add app/stores/modules/ app/stores/index.ts
git commit -m "feat: add store module barrel structure for administration"
```

---

## Task 2: useUserManagementStore

**Files:**
- Create: `app/stores/modules/administration/useUserManagementStore.ts`

- [ ] **Step 1: Write the store**

```ts
import { defineStore } from 'pinia'
import z from 'zod'
import type { UserInfoDto, UserInfoListDto, PageEvent, SortEvent, CellConfig, ColumnDef, AppDataTableExposed, ProcFlag } from '~/types'

export const useUserManagementStore = defineStore('user-management', () => {
  const toast = useAppToast()
  const { t } = useI18n()

  // ─── Search ───
  const searchSchema = z.object({
    searchText: z.string().optional(),
    useFlg: z.string().nullable().optional(),
  })

  const searchForm = useAppForm({
    schema: searchSchema,
    initialValues: { searchText: '', useFlg: null },
    onSubmit: () => {},
    guard: false,
  })

  const statusOptions = computed(() => [
    { label: t('common.all'), value: '' },
    { label: t('common.active'), value: 'Y' },
    { label: t('common.inactive'), value: 'N' },
  ])

  // ─── Table state ───
  const tableRef = ref<AppDataTableExposed<UserInfoDto> | null>(null)
  const rows = ref<UserInfoDto[]>([])
  const totalRecords = ref(0)
  const pagination = ref<PageEvent>({ page: 1, pageSize: 25 })
  const sortState = ref<SortEvent | null>(null)

  // ─── Columns ───
  const columns = computed<ColumnDef[]>(() => [
    { field: 'usrId', header: t('user.usrId'), editable: true, editType: 'input', width: 130, sortable: true },
    { field: 'usrNm', header: t('user.usrNm'), editable: true, editType: 'input', width: 150, sortable: true, validators: { required: true } },
    { field: 'usrEml', header: t('user.usrEml'), editable: true, editType: 'input', width: 190, sortable: true },
    { field: 'usrPhn', header: t('user.usrPhn'), editable: true, editType: 'input', width: 140 },
    { field: 'usrAddr', header: t('user.usrAddr'), editable: true, editType: 'input', width: 200 },
    { field: 'usrDesc', header: t('user.usrDesc'), editable: true, editType: 'input', width: 240 },
    { field: 'roleId', header: t('user.roleId'), editable: true, editType: 'input', width: 140 },
    { field: 'useFlg', header: t('user.useFlg'), editable: true, editType: 'toggle', editProps: { trueValue: 'Y', falseValue: 'N' }, width: 90, align: 'center' },
  ])

  function cellConfig(row: any, field: string): CellConfig | void {
    if (field === 'usrId' && row.procFlag !== 'I') {
      return { editable: false }
    }
  }

  // ─── Query ───
  const requestBody = computed(() => {
    const search = searchForm.values
    const body: Record<string, any> = {
      pagination: { current: pagination.value.page, pageSize: pagination.value.pageSize },
    }
    if (search.searchText) body.searchText = search.searchText
    if (search.useFlg !== null && search.useFlg !== undefined) body.useFlg = search.useFlg
    if (sortState.value) {
      const meta = sortState.value.multiSortMeta
      if (meta && meta.length > 1) {
        body.sorts = meta.map((s) => ({ sortField: s.field, sortType: s.order === 1 ? 'ASC' : 'DESC' }))
      } else {
        body.sort = { sortField: sortState.value.field, sortType: sortState.value.order === 1 ? 'ASC' : 'DESC' }
      }
    }
    return body
  })

  const queryEnabled = ref(false)

  const { isFetching: isLoading, refetch } = useLoadUsers(requestBody, {
    enabled: queryEnabled,
    select: (result: UserInfoListDto) => {
      rows.value = result.userInfo
      totalRecords.value = result.total
      return result
    },
  })

  const { mutate: saveUsersMutate, isPending: isSaving } = useSaveUsers({
    onSuccess: () => {
      tableRef.value?.clearChanges()
      refetch()
    },
  })

  // ─── Actions ───
  function registerTable(ref: AppDataTableExposed<UserInfoDto>) {
    tableRef.value = ref
  }

  function fetchData() {
    queryEnabled.value = true
    refetch()
  }

  function handleSearch() {
    pagination.value = { ...pagination.value, page: 1 }
    fetchData()
  }

  function handlePage(event: PageEvent) {
    pagination.value = event
    fetchData()
  }

  function handleSort(event: SortEvent) {
    sortState.value = event
    fetchData()
  }

  function handleAdd() {
    tableRef.value?.insertRow({ useFlg: 'Y' } as Partial<UserInfoDto>)
  }

  function handleDelete() {
    tableRef.value?.deleteSelected()
  }

  function handleSave() {
    const errors = tableRef.value?.validate() ?? []
    if (errors.length > 0) return
    const changed = tableRef.value?.getRows(['I', 'U', 'D'] as ProcFlag[]) ?? []
    if (changed.length === 0) {
      toast.showInfo(t('common.noChanges'))
      return
    }
    saveUsersMutate(changed)
  }

  return {
    // Search
    searchForm,
    statusOptions,
    // Table
    rows,
    totalRecords,
    columns,
    cellConfig,
    pagination,
    sortState,
    isLoading,
    isSaving,
    // Actions
    registerTable,
    fetchData,
    handleSearch,
    handlePage,
    handleSort,
    handleAdd,
    handleDelete,
    handleSave,
  }
})
```

- [ ] **Step 2: Verify types compile**

Run: `cd frontend && npx nuxi typecheck 2>&1 | head -30`
Expected: No errors related to useUserManagementStore

- [ ] **Step 3: Commit**

```bash
git add app/stores/modules/administration/useUserManagementStore.ts
git commit -m "feat: add useUserManagementStore with queries and actions"
```

---

## Task 3: User Management Components

**Files:**
- Create: `app/components/modules/administration/user-management/search/UserSearchCard.vue`
- Create: `app/components/modules/administration/user-management/search/index.ts`
- Create: `app/components/modules/administration/user-management/tables/UserTable.vue`
- Create: `app/components/modules/administration/user-management/tables/index.ts`
- Create: `app/components/modules/administration/user-management/index.ts`

- [ ] **Step 1: Create UserSearchCard.vue**

```vue
<script lang="ts" setup>
import { useUserManagementStore } from '~/stores/modules/administration'

const store = useUserManagementStore()
const { t } = useI18n()
</script>

<template>
  <SearchCard :form="store.searchForm" @search="store.handleSearch" class="pt-2">
    <Input
      v-bind="store.searchForm.field('searchText')"
      :label="t('common.search')"
      float-label
    />

    <Select
      v-bind="store.searchForm.field('useFlg')"
      :label="t('common.status')"
      :options="store.statusOptions"
      option-label="label"
      option-value="value"
      float-label
    />
  </SearchCard>
</template>
```

- [ ] **Step 2: Create search/index.ts**

```ts
export { default as UserSearchCard } from './UserSearchCard.vue'
```

- [ ] **Step 3: Create UserTable.vue**

```vue
<script lang="ts" setup>
import { useUserManagementStore } from '~/stores/modules/administration'

const store = useUserManagementStore()
const { t } = useI18n()

const tableRef = ref()

onMounted(() => {
  if (tableRef.value) {
    store.registerTable(tableRef.value)
  }
})
</script>

<template>
  <PCard class="p-0">
    <template #content>
      <Flex justify="end" class="pb-2" gap="2">
        <DeleteButton :label="t('user.delete')" @click="store.handleDelete" v-if="tableRef?.hasSelectedRow()" />
        <AddButton :label="t('user.add')" @click="store.handleAdd" />
        <SaveButton :label="t('common.save')" :loading="store.isSaving" @click="store.handleSave" />
      </Flex>

      <AppDataTable
        ref="tableRef"
        :rows="store.rows"
        :columns="store.columns"
        :table-height="350"
        :total-records="store.totalRecords"
        :loading="store.isLoading"
        :editable="true"
        :selectable="true"
        selection-mode="checkbox"
        pagination-mode="server"
        sort-backend="server"
        :cell-config="store.cellConfig"
        @page="store.handlePage"
        @sort="store.handleSort"
        @refresh="store.fetchData"
      />
    </template>
  </PCard>
</template>
```

- [ ] **Step 4: Create tables/index.ts**

```ts
export { default as UserTable } from './UserTable.vue'
```

- [ ] **Step 5: Create module barrel index.ts**

```ts
export * from './search'
export * from './tables'
```

- [ ] **Step 6: Commit**

```bash
git add app/components/modules/administration/user-management/
git commit -m "feat: add UserSearchCard and UserTable components"
```

---

## Task 4: Refactor user-management.vue page

**Files:**
- Modify: `app/pages/administration/user-management.vue`

- [ ] **Step 1: Replace page content with thin shell**

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

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx nuxi build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/pages/administration/user-management.vue
git commit -m "refactor: user-management page now thin shell using store + components"
```

---

## Task 5: useProgramManagementStore

**Files:**
- Create: `app/stores/modules/administration/useProgramManagementStore.ts`

- [ ] **Step 1: Write the store**

```ts
import { defineStore } from 'pinia'
import z from 'zod'
import type {
  ColumnDef,
  ProgramDto,
  ProgramListDto,
  PermissionDto,
  AppDataTableExposed,
  AppTreeDataTableExposed,
  ProcFlag,
} from '~/types'

export const useProgramManagementStore = defineStore('program-management', () => {
  const toast = useAppToast()
  const dialog = useAppDialog()
  const { t } = useI18n()

  // ─── Search ───
  const searchSchema = z.object({
    pgmNm: z.string().optional(),
    pgmTpCd: z.string().nullable().optional(),
    useFlg: z.string().nullable().optional(),
  })

  const searchForm = useAppForm({
    schema: searchSchema,
    initialValues: { pgmNm: '', pgmTpCd: null, useFlg: null },
    onSubmit: () => {},
    guard: false,
  })

  const typeOptions = computed(() => [
    { label: t('common.all'), value: '' },
    { label: 'Menu', value: 'Menu' },
    { label: 'UI', value: 'UI' },
  ])

  const statusOptions = computed(() => [
    { label: t('common.all'), value: '' },
    { label: t('common.active'), value: 'Y' },
    { label: t('common.inactive'), value: 'N' },
  ])

  // ─── Program tree state ───
  const treeTableRef = ref<AppTreeDataTableExposed | null>(null)
  const programList = ref<ProgramDto[]>([])
  const totalRecords = ref(0)
  const selectedPgmId = ref<string | undefined>(undefined)

  const selectedProgramName = computed(() => {
    if (!selectedPgmId.value) return ''
    const pgm = programList.value.find(p => p.pgmId === selectedPgmId.value)
    return pgm ? `${pgm.pgmNm} (${pgm.pgmCd})` : ''
  })

  // ─── Program tree columns ───
  const treeColumns = computed<ColumnDef[]>(() => [
    { field: 'pgmCd', header: t('program.pgmCd'), width: 160, sortable: true },
    { field: 'pgmNm', header: t('program.pgmNm'), width: 200, sortable: true },
    { field: 'pgmTpCd', header: t('program.pgmTpCd'), width: 100, align: 'center', sortable: true, format: (val: string) => val === 'MENU' ? 'Menu' : 'UI' },
    { field: 'useFlg', header: t('program.useFlg'), width: 80, align: 'center', format: (val: string) => val === 'Y' ? 'Active' : 'Inactive' },
  ])

  // ─── Permission table state ───
  const permTableRef = ref<AppDataTableExposed<PermissionDto> | null>(null)
  const permRows = ref<PermissionDto[]>([])

  const permColumns = computed<ColumnDef[]>(() => [
    { field: 'permCd', header: t('program.permCd'), editable: true, editType: 'input', width: 160, validators: { required: true } },
    { field: 'permNm', header: t('program.permNm'), editable: true, editType: 'input', width: 200, validators: { required: true } },
  ])

  // ─── Dialog state ───
  const dialogVisible = ref(false)
  const dialogMode = ref<'create' | 'edit'>('create')
  const editingProgram = ref<ProgramDto | null>(null)

  const dialogSchema = z.object({
    pgmCd: z.string().min(1, 'Program code is required'),
    pgmNm: z.string().min(1, 'Program name is required'),
    pgmTpCd: z.enum(['MENU', 'UI']),
    prntPgmId: z.string().nullable().optional(),
    dspOrder: z.number().optional(),
    pgmRmk: z.string().nullable().optional(),
    useFlg: z.string().optional(),
  })

  const dialogForm = useAppForm({
    schema: dialogSchema,
    initialValues: {
      pgmCd: '',
      pgmNm: '',
      pgmTpCd: 'MENU' as const,
      prntPgmId: null,
      dspOrder: 9999,
      pgmRmk: '',
      useFlg: 'Y',
    },
    onSubmit: (values) => {
      if (dialogMode.value === 'create') {
        insertProgramMutate(values as ProgramDto)
      } else {
        updateProgramMutate({
          pgmId: editingProgram.value?.pgmId,
          ...values,
        } as ProgramDto)
      }
    },
    guard: false,
  })

  const parentOptions = computed(() =>
    programList.value
      .filter((p) => p.pgmTpCd === 'MENU')
      .map((p) => ({ label: `${p.pgmNm} (${p.pgmCd})`, value: p.pgmId }))
  )

  // ─── Query: Program tree ───
  const requestBody = computed(() => {
    const search = searchForm.values
    const body: Record<string, any> = {}
    if (search.pgmNm) body.pgmNm = search.pgmNm
    if (search.pgmTpCd) body.pgmTpCd = search.pgmTpCd
    if (search.useFlg !== null && search.useFlg !== undefined && search.useFlg !== '') {
      body.useFlg = search.useFlg
    }
    return body
  })

  const queryEnabled = ref(false)

  const { isFetching: isLoadingTree, refetch: refetchTree } = useLoadPrograms(requestBody, {
    enabled: queryEnabled,
    select: (result: ProgramListDto) => {
      programList.value = result.programList
      totalRecords.value = result.total
      return result
    },
  })

  // ─── Query: Permissions ───
  const { isFetching: isLoadingPerms, refetch: refetchPerms } = useLoadPermissions(
    selectedPgmId,
    {
      enabled: computed(() => !!selectedPgmId.value),
      select: (result: PermissionDto[]) => {
        permRows.value = result
        return result
      },
    }
  )

  // ─── Mutations ───
  const { mutate: insertProgramMutate, isPending: isInserting } = useInsertProgram({
    onSuccess: () => {
      dialogVisible.value = false
      refetchTree()
    },
  })

  const { mutate: updateProgramMutate, isPending: isUpdating } = useUpdateProgram({
    onSuccess: () => {
      dialogVisible.value = false
      refetchTree()
    },
  })

  const { mutate: deleteProgramsMutate, isPending: isDeleting } = useDeletePrograms({
    onSuccess: () => {
      clearAll()
      refetchTree()
    },
  })

  const { mutate: savePermissionsMutate, isPending: isSavingPerms } = useSavePermissions({
    onSuccess: () => {
      permTableRef.value?.clearChanges()
      refetchPerms()
    },
  })

  const isDialogSaving = computed(() => isInserting.value || isUpdating.value)

  // ─── Actions ───
  function registerTreeTable(ref: AppTreeDataTableExposed) {
    treeTableRef.value = ref
  }

  function registerPermTable(ref: AppDataTableExposed<PermissionDto>) {
    permTableRef.value = ref
  }

  function clearAll() {
    selectedPgmId.value = undefined
    permRows.value = []
    treeTableRef.value?.clearSelection()
    permTableRef.value?.clearSelection()
    permTableRef.value?.clearChanges()
  }

  function fetchData() {
    const isUnsaved = permTableRef.value?.hasChanges()

    if (isUnsaved) {
      dialog.confirm({
        header: t('common.unsavedChanges'),
        message: t('common.unsavedChangesMessage'),
        acceptButton: { label: t('common.continue') },
        onAccept: () => {
          queryEnabled.value = true
          refetchTree()
          clearAll()
        },
      })
    } else {
      queryEnabled.value = true
      refetchTree()
      clearAll()
    }
  }

  function handleSearch() {
    fetchData()
  }

  function selectProgram(pgmId: string) {
    selectedPgmId.value = pgmId
  }

  function openDialog(mode: 'create' | 'edit', program?: ProgramDto) {
    dialogMode.value = mode
    if (mode === 'edit' && program) {
      editingProgram.value = program
      dialogForm.setFieldsValues({
        pgmCd: program.pgmCd ?? '',
        pgmNm: program.pgmNm ?? '',
        pgmTpCd: program.pgmTpCd ?? 'MENU',
        prntPgmId: program.prntPgmId ?? null,
        dspOrder: program.dspOrder ?? 9999,
        pgmRmk: program.pgmRmk ?? '',
        useFlg: program.useFlg,
      })
    } else {
      editingProgram.value = null
      dialogForm.resetForm()
    }
    dialogVisible.value = true
  }

  function closeDialog() {
    dialogVisible.value = false
    dialogForm.resetForm()
  }

  function deletePrograms() {
    const selected = treeTableRef.value?.getSelectedRows() ?? []
    if (selected.length === 0) {
      toast.showInfo(t('common.noSelection'))
      return
    }
    deleteProgramsMutate(selected)
  }

  // ─── Permission actions ───
  function handleAddPermission() {
    if (!selectedPgmId.value) return
    permTableRef.value?.insertRow({
      pgmId: selectedPgmId.value,
      permCd: '',
      permNm: '',
    } as Partial<PermissionDto>)
  }

  function handleDeletePermission() {
    permTableRef.value?.deleteSelected()
  }

  function handleSavePermissions() {
    const errors = permTableRef.value?.validate() ?? []
    if (errors.length > 0) return
    const changed = permTableRef.value?.getRows(['I', 'U', 'D'] as ProcFlag[]) ?? []
    if (changed.length === 0) {
      toast.showInfo(t('common.noChanges'))
      return
    }
    savePermissionsMutate(changed)
  }

  return {
    // Search
    searchForm,
    typeOptions,
    statusOptions,
    // Program tree
    programList,
    totalRecords,
    treeColumns,
    selectedPgmId,
    selectedProgramName,
    isLoadingTree,
    // Permissions
    permRows,
    permColumns,
    isLoadingPerms,
    isSavingPerms,
    // Dialog
    dialogVisible,
    dialogMode,
    dialogForm,
    parentOptions,
    isDialogSaving,
    // Actions
    registerTreeTable,
    registerPermTable,
    fetchData,
    handleSearch,
    selectProgram,
    openDialog,
    closeDialog,
    deletePrograms,
    handleAddPermission,
    handleDeletePermission,
    handleSavePermissions,
  }
})
```

- [ ] **Step 2: Verify types compile**

Run: `cd frontend && npx nuxi typecheck 2>&1 | head -30`
Expected: No errors related to useProgramManagementStore

- [ ] **Step 3: Commit**

```bash
git add app/stores/modules/administration/useProgramManagementStore.ts
git commit -m "feat: add useProgramManagementStore with queries and actions"
```

---

## Task 6: Program Management Components — Search

**Files:**
- Create: `app/components/modules/administration/program-management/search/ProgramSearchCard.vue`
- Create: `app/components/modules/administration/program-management/search/index.ts`

- [ ] **Step 1: Create ProgramSearchCard.vue**

```vue
<script lang="ts" setup>
import { useProgramManagementStore } from '~/stores/modules/administration'

const store = useProgramManagementStore()
const { t } = useI18n()
</script>

<template>
  <SearchCard :form="store.searchForm" @search="store.handleSearch" class="pt-2">
    <Input
      v-bind="store.searchForm.field('pgmNm')"
      :label="t('program.pgmNm')"
      float-label
    />

    <Select
      v-bind="store.searchForm.field('pgmTpCd')"
      :label="t('program.pgmTpCd')"
      :options="store.typeOptions"
      option-label="label"
      option-value="value"
      float-label
    />

    <Select
      v-bind="store.searchForm.field('useFlg')"
      :label="t('common.status')"
      :options="store.statusOptions"
      true-value="Y"
      false-value="N"
      option-label="label"
      option-value="value"
      float-label
    />
  </SearchCard>
</template>
```

- [ ] **Step 2: Create search/index.ts**

```ts
export { default as ProgramSearchCard } from './ProgramSearchCard.vue'
```

- [ ] **Step 3: Commit**

```bash
git add app/components/modules/administration/program-management/search/
git commit -m "feat: add ProgramSearchCard component"
```

---

## Task 7: Program Management Components — Tables

**Files:**
- Create: `app/components/modules/administration/program-management/tables/ProgramTreeTable.vue`
- Create: `app/components/modules/administration/program-management/tables/PermissionTable.vue`
- Create: `app/components/modules/administration/program-management/tables/index.ts`

- [ ] **Step 1: Create ProgramTreeTable.vue**

```vue
<script lang="ts" setup>
import type { ProgramDto } from '~/types'
import { useProgramManagementStore } from '~/stores/modules/administration'

const store = useProgramManagementStore()
const { t } = useI18n()

const treeTableRef = ref()

onMounted(() => {
  if (treeTableRef.value) {
    store.registerTreeTable(treeTableRef.value)
  }
})

function handleRowClick(payload: { data: ProgramDto; originalEvent: Event }) {
  store.selectProgram(payload.data.pgmId)
}

function handlePgmIdClick(data: ProgramDto) {
  store.openDialog('edit', data)
}
</script>

<template>
  <PCard class="p-0">
    <template #content>
      <Flex justify="end" class="pb-2" gap="2">
        <DeleteButton
          :label="t('program.delete')"
          @click="store.deletePrograms"
          v-if="treeTableRef?.hasSelectedRow()"
        />
        <AddButton :label="t('program.add')" @click="store.openDialog('create')" />
      </Flex>

      <AppTreeDataTable
        ref="treeTableRef"
        :rows="store.programList"
        :columns="store.treeColumns"
        :total-records="store.totalRecords"
        :loading="store.isLoadingTree"
        :selectable="true"
        selection-mode="checkbox"
        row-key="pgmId"
        parent-key="prntPgmId"
        data-mode="all"
        default-expand-all
        :table-height="350"
        @refresh="store.fetchData"
        @row-click="handleRowClick"
      >
        <template #body-pgmCd="{ data }">
          <a
            class="text-primary cursor-pointer hover:underline flex items-center gap-1.5"
            @click.stop="handlePgmIdClick(data)"
          >
            <i :class="data.pgmTpCd === 'MENU' ? 'pi pi-folder text-amber-500' : 'pi pi-desktop text-blue-500'" class="text-sm" />
            {{ data.pgmCd }}
          </a>
        </template>

        <template #body-useFlg="{ data }">
          <span
            :class="data.useFlg === 'Y'
              ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'"
          >
            {{ data.useFlg === 'Y' ? t('common.active') : t('common.inactive') }}
          </span>
        </template>
      </AppTreeDataTable>
    </template>
  </PCard>
</template>
```

- [ ] **Step 2: Create PermissionTable.vue**

```vue
<script lang="ts" setup>
import { useProgramManagementStore } from '~/stores/modules/administration'

const store = useProgramManagementStore()
const { t } = useI18n()

const permTableRef = ref()

onMounted(() => {
  if (permTableRef.value) {
    store.registerPermTable(permTableRef.value)
  }
})
</script>

<template>
  <PCard class="p-0">
    <template #content>
      <template v-if="store.selectedPgmId">
        <Flex justify="between" align="center" class="pb-2">
          <span class="text-sm font-semibold text-surface-700 dark:text-surface-200">
            {{ store.selectedProgramName }}
          </span>
          <Flex gap="2">
            <DeleteButton
              :label="t('program.deletePermission')"
              @click="store.handleDeletePermission"
              v-if="permTableRef?.hasSelectedRow()"
            />
            <AddButton :label="t('program.addPermission')" @click="store.handleAddPermission" />
            <SaveButton
              :label="t('common.save')"
              :loading="store.isSavingPerms"
              @click="store.handleSavePermissions"
            />
          </Flex>
        </Flex>

        <AppDataTable
          ref="permTableRef"
          :rows="store.permRows"
          data-mode="all"
          :columns="store.permColumns"
          :loading="store.isLoadingPerms"
          :editable="true"
          :selectable="true"
          selection-mode="checkbox"
          :table-height="350"
        />
      </template>

      <template v-else>
        <div class="flex items-center justify-center h-48 text-surface-400">
          {{ t('program.selectProgram') }}
        </div>
      </template>
    </template>
  </PCard>
</template>
```

- [ ] **Step 3: Create tables/index.ts**

```ts
export { default as ProgramTreeTable } from './ProgramTreeTable.vue'
export { default as PermissionTable } from './PermissionTable.vue'
```

- [ ] **Step 4: Commit**

```bash
git add app/components/modules/administration/program-management/tables/
git commit -m "feat: add ProgramTreeTable and PermissionTable components"
```

---

## Task 8: Program Management Components — Dialog

**Files:**
- Create: `app/components/modules/administration/program-management/dialogs/ProgramDialog.vue`
- Create: `app/components/modules/administration/program-management/dialogs/index.ts`

- [ ] **Step 1: Create ProgramDialog.vue**

```vue
<script lang="ts" setup>
import { useProgramManagementStore } from '~/stores/modules/administration'

const store = useProgramManagementStore()
const { t } = useI18n()
</script>

<template>
  <PDialog
    v-model:visible="store.dialogVisible"
    :header="store.dialogMode === 'create' ? t('program.createProgram') : t('program.editProgram')"
    modal
    :style="{ width: '500px' }"
    :draggable="false"
  >
    <PForm :ref="store.dialogForm.formRef" v-bind="store.dialogForm.formProps" @submit="store.dialogForm.handleSubmit">
      <div class="flex flex-col gap-4 pt-2">
        <Input
          v-bind="store.dialogForm.field('pgmCd')"
          :label="t('program.pgmCd')"
          float-label
          required
        />

        <Input
          v-bind="store.dialogForm.field('pgmNm')"
          :label="t('program.pgmNm')"
          float-label
          required
        />

        <Select
          v-bind="store.dialogForm.field('pgmTpCd')"
          :label="t('program.pgmTpCd')"
          :options="[{ label: 'MENU', value: 'MENU' }, { label: 'UI', value: 'UI' }]"
          option-label="label"
          option-value="value"
          float-label
          required
        />

        <Select
          v-bind="store.dialogForm.field('prntPgmId')"
          :label="t('program.prntPgmId')"
          :options="store.parentOptions"
          option-label="label"
          option-value="value"
          float-label
          show-clear
        />

        <InputNumber
          v-bind="store.dialogForm.field('dspOrder')"
          :label="t('program.dspOrder')"
          float-label
        />

        <Input
          v-bind="store.dialogForm.field('pgmRmk')"
          :label="t('program.pgmRmk')"
          variant="textarea"
          float-label
        />

        <CheckBox
          v-bind="store.dialogForm.field('useFlg')"
          :label="t('program.useFlg')"
          true-value="Y"
          false-value="N"
        />
      </div>

      <div class="flex justify-end gap-2 pt-4">
        <PButton
          :label="t('common.cancel')"
          severity="secondary"
          @click="store.closeDialog"
        />
        <SaveButton
          :label="t('common.save')"
          :loading="store.isDialogSaving"
          type="submit"
        />
      </div>
    </PForm>
  </PDialog>
</template>
```

- [ ] **Step 2: Create dialogs/index.ts**

```ts
export { default as ProgramDialog } from './ProgramDialog.vue'
```

- [ ] **Step 3: Commit**

```bash
git add app/components/modules/administration/program-management/dialogs/
git commit -m "feat: add ProgramDialog component"
```

---

## Task 9: Program Management Module Barrel

**Files:**
- Create: `app/components/modules/administration/program-management/index.ts`

- [ ] **Step 1: Create module barrel**

```ts
export * from './search'
export * from './tables'
export * from './dialogs'
```

- [ ] **Step 2: Commit**

```bash
git add app/components/modules/administration/program-management/index.ts
git commit -m "feat: add program-management module barrel export"
```

---

## Task 10: Refactor program-management.vue page

**Files:**
- Modify: `app/pages/administration/program-management.vue`

- [ ] **Step 1: Replace page content with thin shell**

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

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx nuxi build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/pages/administration/program-management.vue
git commit -m "refactor: program-management page now thin shell using store + components"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Run full typecheck**

Run: `cd frontend && npx nuxi typecheck`
Expected: No new errors

- [ ] **Step 2: Run dev server smoke test**

Run: `cd frontend && npx nuxi dev --port 3001 &` then verify pages load

- [ ] **Step 3: Fix any type issues found**

Address any `AppTreeDataTableExposed` type import issues — check if this type exists in `~/types`. If not, use generic type or add it.

- [ ] **Step 4: Final commit if fixes needed**

```bash
git add -A
git commit -m "fix: resolve type issues from module decomposition"
```
