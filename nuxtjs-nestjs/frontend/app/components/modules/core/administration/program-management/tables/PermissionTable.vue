<script lang="ts" setup>
import { useProgramManagementStore } from '~/stores/modules/administration'

const store = useProgramManagementStore()
const { t } = useI18n()

const permTableRef = ref()
const isLoadingPerms = computed(() => store.isLoadingPerms)

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
          :loading="isLoadingPerms"
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
