<script lang="ts" setup>
import type { ColumnDef, RoleDto } from '~/types'
import { useRoleManagementStore } from '~/stores'

const store = useRoleManagementStore()
const { t } = useI18n()

const tableRef = ref()

const columns = computed<ColumnDef[]>(() => [
  { field: 'roleCd', header: t('role.roleCd'), width: 160, sortable: true },
  { field: 'roleNm', header: t('role.roleNm'), width: 200, sortable: true },
  { field: 'roleDesc', header: t('role.roleDesc'), width: 300 },
  { field: 'useFlg', header: t('role.useFlg'), width: 100, align: 'center', sortable: true, format: (val: string) => val === 'Y' ? t('common.active') : t('common.inactive') },
  { field: 'createdBy', header: t('role.createdBy'), width: 140 },
  { field: 'createAt', header: t('role.createdAt'), width: 140 },
  { field: 'updatedBy', header: t('role.updatedBy'), width: 140 },
  { field: 'updatedAt', header: t('role.updatedAt'), width: 140 },
])

function handleRoleCdClick(data: RoleDto) {
  store.openDialog('edit', data)
}

function handleDelete() {
  const selected = tableRef.value?.getSelectedRows() ?? []
  if (selected.length === 0) return
  store.deleteRoles(selected)
}

 // Apply dark mode from stored preferences
  watch(
    () => store.isLoading,
    (isLoading) => {
        console.log(isLoading);
    }
  )

</script>

<template>
  <PCard class="p-0">
    <template #content>
      <Flex justify="end" gap="2" class="pb-2">
        <DeleteButton
          :label="t('role.delete')"
          @click="handleDelete"
          v-if="tableRef?.hasSelectedRow()"
        />
        <AddButton :label="t('role.add')" @click="store.openDialog('create')" />
      </Flex>

      <AppDataTable
        ref="tableRef"
        :rows="store.rows"
        :columns="columns"
        :total-records="store.totalRecords"
        :loading="store.isLoading"
        :editable="false"
        :selectable="true"
        selection-mode="checkbox"
        pagination-mode="server"
        sort-backend="server"
        :table-height="350"
        @page="store.handlePage"
        @sort="store.handleSort"
        @refresh="store.fetchData"
      >
        <template #body-roleCd="{ data }">
          <a
            class="text-primary cursor-pointer hover:underline"
            @click.stop="handleRoleCdClick(data)"
          >
            {{ data.roleCd }}
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
      </AppDataTable>
    </template>
  </PCard>
</template>
