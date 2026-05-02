<script lang="ts" setup>

const { t } = useI18n()

const statusOptions = [
  { label: t('common.all', 'All'), value: '' },
  { label: t('common.active', 'Active'), value: true },
  { label: t('common.inactive', 'Inactive'), value: false }
]

const {
  searchForm,
  tableRef,
  columns,
  rows,
  totalRecords,
  isLoading,
  isSaving,
  fetchData,
  cellConfig,
  handleSearch,
  handlePage,
  handleSort,
  handleAddUser,
  handleDeleteUser,
  handleSaveUser,
} = useUserManagement();

onMounted(() => fetchData())

// --- Columns ---


</script>

<template>
  <div class="flex flex-col gap-2.5 pt-1">
    <!-- Search -->
    <SearchCard :form="searchForm" @search="handleSearch" class="pt-2">
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
            <DeleteButton :label="t('adm.user.delete')" @click="handleDeleteUser" v-if="tableRef?.hasSelectedRow()" />
            <AddButton :label="t('adm.user.add')" @click="handleAddUser" />
            <SaveButton :label="t('common.save')" :loading="isSaving" @click="handleSaveUser" />
        </Flex>

        <!-- Table -->
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
