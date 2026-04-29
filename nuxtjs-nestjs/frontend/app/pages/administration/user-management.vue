<script lang="ts" setup>
import { z } from 'zod'
import type { ColumnDef, CellConfig, PageEvent, SortEvent } from '~/types/table'
import type { SuccessDto, UserInfoDto, UserInfoListDto } from '~/types/'

const toast = useAppToast();
const { t } = useI18n()

// --- Search form ---
const searchSchema = z.object({
  searchText: z.string().optional(),
  useFlg: z.boolean().nullable().optional()
})

const searchForm = useAppForm({
  schema: searchSchema,
  initialValues: { searchText: '', useFlg: null },
  onSubmit: () => {},
  guard: false
})

const statusOptions = [
  { label: t('common.all', 'All'), value: '' },
  { label: t('common.active', 'Active'), value: true },
  { label: t('common.inactive', 'Inactive'), value: false }
]

// --- Table state ---
const { tableRef, validate, getRows, clearChanges } = useAppDataTable<UserInfoDto>()

const rows = ref<UserInfoDto[]>([])
const totalRecords = ref(0)
const pagination = ref<PageEvent>({ page: 1, pageSize: 25 })
const sortState = ref<SortEvent | null>(null)

// --- Load data ---
const { loading, execute: loadUsers } = useApi<UserInfoListDto>(QUERY_KEY.ADMINISTRATION.USERS.LIST, {
  method: 'POST'
})

async function fetchData() {
  const search = searchForm.values
  const body: Record<string, any> = {
    pagination: { current: pagination.value.page, pageSize: pagination.value.pageSize }
  }
  if (search.searchText) body.searchText = search.searchText
  if (search.useFlg !== null && search.useFlg !== undefined) body.useFlg = search.useFlg
  if (sortState.value) {
    body.sort = { field: sortState.value.field, order: sortState.value.order === 1 ? 'ASC' : 'DESC' }
  }

  const result = await loadUsers(body)
  if (result) {
    rows.value = result.userInfo
    totalRecords.value = result.total
  }
}

onMounted(() => fetchData())

function onSearch() {
  pagination.value = { ...pagination.value, page: 1 }
  fetchData()
}

function onPage(event: PageEvent) {
  pagination.value = event
  fetchData()
}

function onSort(event: SortEvent) {
  sortState.value = event
  fetchData()
}

// --- Columns ---
const columns: ColumnDef[] = [
  {
    field: 'usrId',
    header: t('user.usrId', 'User ID'),
    editable: true,
    editType: 'input',
    width: 130,
    sortable: true
  },
  {
    field: 'usrNm',
    header: t('user.usrNm', 'Name'),
    editable: true,
    editType: 'input',
    width: 150,
    sortable: true,
    validators: { required: true }
  },
  {
    field: 'usrEml',
    header: t('user.usrEml', 'Email'),
    editable: true,
    editType: 'input',
    width: 190,
    sortable: true
  },
  {
    field: 'usrPhn',
    header: t('user.usrPhn', 'Phone'),
    editable: true,
    editType: 'input',
    width: 140
  },
  {
    field: 'usrAddr',
    header: t('user.usrAddr', 'Address'),
    editable: true,
    editType: 'input',
    width: 200
  },
  {
    field: 'usrDesc',
    header: t('user.usrDesc', 'Description'),
    editable: true,
    editType: 'input',
    width: 240
  },
  {
    field: 'roleId',
    header: t('user.roleId', 'Role'),
    editable: true,
    editType: 'input',
    width: 140
  },
  {
    field: 'useFlg',
    header: t('user.useFlg', 'Active'),
    editable: true,
    editType: 'toggle',
    editProps: { trueValue: 'Y', falseValue: 'N' },
    width: 90,
    align: 'center'
  }
]

// usrId is editable only on new rows (procFlag === 'I')
function cellConfig(row: any, field: string): CellConfig | void {
  if (field === 'usrId' && row.procFlag !== 'I') {
    return { editable: false }
  }
}

// --- Save ---
const { loading: isSaving, execute: saveUsers } = useApi<SuccessDto>(QUERY_KEY.ADMINISTRATION.USERS.SAVE, {
  method: 'POST',
  onSuccess: async () => {
    toast.showSuccess(t('common.saveSuccess', 'Saved successfully'))
    clearChanges()
    await fetchData()
  },
  onError: () => {
    toast.showError(t('common.saveError', 'Failed to save'))
  }
})

async function onSave() {
  const errors = validate()
  if (errors.length > 0) return
  const changed = getRows(['I', 'U', 'D'])
  if (changed.length === 0) {
    toast.showInfo(t('common.noChanges', 'No changes to save'))
    return
  }
  await saveUsers(changed)
}

function handleAddUser() {
  tableRef.value?.insertRow({
    useFlg: 'Y'
  })
}

</script>

<template>
  <div class="flex flex-col gap-4 pt-2">
    <!-- Search -->
    <SearchCard :form="searchForm" @search="onSearch" class="pt-2">
      <FormField :label="t('common.search', 'Search')" float-label>
        <PInputText
          v-bind="searchForm.field('searchText')"
          class="w-full"
        />
      </FormField>

      <FormField :label="t('common.status', 'Status')" float-label>
        <PSelect
          v-bind="searchForm.field('useFlg')"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          class="w-full"
        />
      </FormField>
    </SearchCard>

    <PCard class="p-0">
      <template #content>
        <Flex justify="end" class="pb-2" gap="2">
            <Button
              :label="t('adm.user.add')"
              icon="pi pi-plus"
              class="p-button-sm p-button-outlined"
              @click="handleAddUser"
            />
            <SaveButton :label="t('common.save')" :loading="isSaving" @click="onSave" />
        </Flex>

        <!-- Table -->
        <AppDataTable
          ref="tableRef"
          :rows="rows"
          :columns="columns"
          :table-height="350"
          :total-records="totalRecords"
          :loading="loading"
          :editable="true"
          :selectable="true"
          selection-mode="checkbox"
          pagination-mode="server"
          sort-backend="server"
          :cell-config="cellConfig"
          @page="onPage"
          @sort="onSort"
          @refresh="fetchData"
        />
      </template>
    </PCard>
  </div>
</template>
