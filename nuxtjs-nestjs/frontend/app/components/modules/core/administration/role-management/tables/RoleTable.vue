<script lang="ts" setup>
import type { ColumnDef, RoleDto } from '~/types';

const { t } = useI18n()
const rows = ref<RoleDto[]>([]);

const { tableRef } = useAppDataTable();

// Columns Definition
const columns = computed<ColumnDef[]>(() => [
    { field: 'permCd', header: t('program.permCd'), editable: true, editType: 'input', width: 160, validators: { required: true } },
    { field: 'permNm', header: t('program.permNm'), editable: true, editType: 'input', width: 200, validators: { required: true } },
])

// Event handler
function handleAddRole() {

}

function handleDeleteRole() {

}

</script>


<template>
    <PCard class="p-0">
    <template #content>
        <Flex gap="2">
            <DeleteButton
              :label="t('program.deletePermission')"
              @click="handleDeleteRole"
              v-if="tableRef?.hasSelectedRow()"
            />
            <AddButton :label="t('program.addPermission')" @click="handleAddRole" />
        </Flex>

        <AppDataTable
          ref="permTableRef"
          data-mode="all"
          :rows="rows"
          :columns="columns"
          :editable="true"
          :selectable="true"
          selection-mode="checkbox"
          :table-height="350"
        />
    </template>
  </PCard>
</template>