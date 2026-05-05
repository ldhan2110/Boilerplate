<script lang="ts" setup>
import type { UserInfoDto, ColumnDef, AppDataTableExposed, ProcFlag, RoleDto, RoleListDto } from '~/types'
import { useUserManagementStore } from '~/stores'

const store = useUserManagementStore()
const toast = useAppToast()
const { t } = useI18n()

// ─── Table ref ───
const tableRef = ref<AppDataTableExposed<UserInfoDto> | null>(null)

// ─── Load roles for dropdown ───
const rolesRequestBody = computed(() => ({
  pagination: { current: 1, pageSize: 9999 },
}))

const { data: rolesData } = useLoadRoles(rolesRequestBody, {
  select: (result: RoleListDto) => result.roleList,
})

const roleOptions = computed<RoleDto[]>(() => rolesData.value ?? [])

// ─── Role lookup map for display ───
const roleMap = computed(() => {
  const map = new Map<string, string>()
  for (const r of roleOptions.value) {
    if (r.roleId && r.roleNm) map.set(r.roleId, r.roleNm)
  }
  return map
})

// ─── Columns ───
const columns = computed<ColumnDef[]>(() => [
  { field: 'usrId', header: t('user.usrId'), editable: false, editType: 'input', width: 130, sortable: true },
  { field: 'usrNm', header: t('user.usrNm'), editable: true, editType: 'input', width: 150, sortable: true, validators: { required: true } },
  { field: 'usrEml', header: t('user.usrEml'), editable: true, editType: 'input', width: 190, sortable: true },
  { field: 'usrPhn', header: t('user.usrPhn'), editable: true, editType: 'input', width: 140 },
  { field: 'usrAddr', header: t('user.usrAddr'), editable: true, editType: 'input', width: 200 },
  { field: 'usrDesc', header: t('user.usrDesc'), editable: true, editType: 'input', width: 240 },
  {
    field: 'roleId',
    header: t('user.roleId'),
    editable: true,
    editType: 'select',
    editOptions: roleOptions.value,
    editProps: { optionLabel: 'roleNm', optionValue: 'roleId' },
    width: 160,
    format: (val: string) => roleMap.value.get(val) ?? val ?? '',
  },
  { field: 'useFlg', header: t('user.useFlg'), editable: true, editType: 'toggle', editProps: { trueValue: 'Y', falseValue: 'N' }, width: 90, align: 'center' },
])

// ─── Save mutation ───
const { mutate: saveUsersMutate, isPending: isSaving } = useSaveUsers({
  onSuccess: () => {
    tableRef.value?.clearChanges()
    store.refetch()
  },
})

// ─── Actions ───
function handleAdd() {
  tableRef.value?.insertRow({ useFlg: 'Y' } as any)
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

const isLoading = computed(() => store.isLoading)
</script>

<template>
  <PCard class="p-0">
    <template #content>
      <Flex justify="end" class="pb-2" gap="2">
        <DeleteButton :label="t('user.delete')" @click="handleDelete" v-if="tableRef?.hasSelectedRow()" />
        <AddButton :label="t('user.add')" @click="handleAdd" />
        <SaveButton :label="t('common.save')" :loading="isSaving" @click="handleSave" />
      </Flex>

      <AppDataTable
        ref="tableRef"
        :rows="store.rows"
        :columns="columns"
        :table-height="350"
        :total-records="store.totalRecords"
        :loading="isLoading"
        :editable="true"
        :selectable="true"
        selection-mode="checkbox"
        pagination-mode="server"
        sort-backend="server"
        @page="store.handlePage"
        @sort="store.handleSort"
        @refresh="store.fetchData"
      />
    </template>
  </PCard>
</template>
