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
  store.selectProgram(payload.data.pgmId!)
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
