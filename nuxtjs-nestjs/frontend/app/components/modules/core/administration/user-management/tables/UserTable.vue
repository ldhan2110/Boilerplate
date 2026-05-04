<script lang="ts" setup>
import { useUserManagementStore } from '~/stores/modules/administration'

const store = useUserManagementStore()
const { t } = useI18n()

const tableRef = ref()
const isLoading = computed(() => store.isLoading)

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
        :loading="isLoading"
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
