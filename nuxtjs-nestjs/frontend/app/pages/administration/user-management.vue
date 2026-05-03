<script lang="ts" setup>
import z from 'zod'
import type { CellConfig, ColumnDef, PageEvent, SortEvent, UserInfoDto, UserInfoListDto } from '~/types'

const toast = useAppToast()
const { t } = useI18n()

// ─── Search form ───
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

const statusOptions = [
  { label: t('common.all'), value: '' },
  { label: t('common.active'), value: 'Y' },
  { label: t('common.inactive'), value: 'N' },
]

// ─── Table state ───
const { tableRef, validate, getRows, clearChanges } = useAppDataTable<UserInfoDto>()
const rows = ref<UserInfoDto[]>([])
const totalRecords = ref(0)
const pagination = ref<PageEvent>({ page: 1, pageSize: 25 })
const sortState = ref<SortEvent | null>(null)

// ─── Column Definitions ───
const columns: ColumnDef[] = [
  { field: 'usrId', header: t('user.usrId'), editable: true, editType: 'input', width: 130, sortable: true },
  { field: 'usrNm', header: t('user.usrNm'), editable: true, editType: 'input', width: 150, sortable: true, validators: { required: true } },
  { field: 'usrEml', header: t('user.usrEml'), editable: true, editType: 'input', width: 190, sortable: true },
  { field: 'usrPhn', header: t('user.usrPhn'), editable: true, editType: 'input', width: 140 },
  { field: 'usrAddr', header: t('user.usrAddr'), editable: true, editType: 'input', width: 200 },
  { field: 'usrDesc', header: t('user.usrDesc'), editable: true, editType: 'input', width: 240 },
  { field: 'roleId', header: t('user.roleId'), editable: true, editType: 'input', width: 140 },
  { field: 'useFlg', header: t('user.useFlg'), editable: true, editType: 'toggle', editProps: { trueValue: 'Y', falseValue: 'N' }, width: 90, align: 'center' },
]

function cellConfig(row: any, field: string): CellConfig | void {
  if (field === 'usrId' && row.procFlag !== 'I') {
    return { editable: false }
  }
}

// ─── TanStack Query ───
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
    clearChanges()
    refetch()
  },
})

// ─── Event handlers ───
function fetchData() {
  queryEnabled.value = true
  refetch()
}

function handleAddUser() {
  tableRef.value?.insertRow({ useFlg: 'Y' })
}

function handleDeleteUser() {
  tableRef.value?.deleteSelected()
}

async function handleSaveUser() {
  const errors = validate()
  if (errors.length > 0) return
  const changed = getRows(['I', 'U', 'D'])
  if (changed.length === 0) {
    toast.showInfo(t('common.noChanges'))
    return
  }
  saveUsersMutate(changed)
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

onMounted(() => fetchData())
</script>

<template>
  <div class="flex flex-col gap-2.5 pt-1">
    <!-- Search -->
    <SearchCard :form="searchForm" @search="handleSearch" class="pt-2">
      <Input
        v-bind="searchForm.field('searchText')"
        :label="t('common.search')"
        float-label
      />

      <Select
        v-bind="searchForm.field('useFlg')"
        :label="t('common.status')"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        float-label
      />
    </SearchCard>

    <PCard class="p-0">
      <template #content>
        <Flex justify="end" class="pb-2" gap="2">
          <DeleteButton :label="t('user.delete')" @click="handleDeleteUser" v-if="tableRef?.hasSelectedRow()" />
          <AddButton :label="t('user.add')" @click="handleAddUser" />
          <SaveButton :label="t('common.save')" :loading="isSaving" @click="handleSaveUser" />
        </Flex>

        <AppDataTable
          ref="tableRef"
          :rows="rows"
          :columns="columns"
          :table-height="350"
          :total-records="totalRecords"
          :loading="isLoading"
          :editable="true"
          :selectable="true"
          selection-mode="checkbox"
          pagination-mode="server"
          sort-backend="server"
          :cell-config="cellConfig"
          @page="handlePage"
          @sort="handleSort"
          @refresh="fetchData"
        />
      </template>
    </PCard>
  </div>
</template>
