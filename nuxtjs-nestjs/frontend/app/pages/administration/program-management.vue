<script lang="ts" setup>
import type { ProgramDto } from '~/types'

const { t } = useI18n()

const typeOptions = [
  { label: t('common.all', 'All'), value: '' },
  { label: 'MENU', value: 'MENU' },
  { label: 'UI', value: 'UI' },
]

const statusOptions = [
  { label: t('common.all', 'All'), value: '' },
  { label: t('common.active', 'Active'), value: 'Y' },
  { label: t('common.inactive', 'Inactive'), value: 'N' },
]

const {
  searchForm,
  treeTableRef,
  treeColumns,
  programList,
  totalRecords,
  isLoadingTree,
  selectedPgmId,
  fetchData,
  handleSearch,
  handleRowClick,
  handlePgmIdClick,
  handleAddProgram,
  handleDeletePrograms,
  dialogVisible,
  dialogMode,
  dialogForm,
  parentOptions,
  isDialogSaving,
  permTableRef,
  permColumns,
  permRows,
  isLoadingPerms,
  isSavingPerms,
  handleAddPermission,
  handleDeletePermission,
  handleSavePermissions,
} = useProgramManagement()

onMounted(() => fetchData())
</script>

<template>
  <div class="flex flex-col gap-2.5 pt-1">
    <!-- Search -->
    <SearchCard :form="searchForm" @search="handleSearch" class="pt-2">
      <Input
        v-bind="searchForm.field('pgmNm')"
        :label="t('program.pgmNm', 'Program Name')"
        float-label
      />

      <Select
        v-bind="searchForm.field('pgmTpCd')"
        :label="t('program.pgmTpCd', 'Type')"
        :options="typeOptions"
        option-label="label"
        option-value="value"
        float-label
      />

      <Select
        v-bind="searchForm.field('useFlg')"
        :label="t('common.status', 'Status')"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        float-label
      />
    </SearchCard>

    <!-- Split view -->
    <div class="grid grid-cols-2 gap-2.5">
      <!-- Left: Program tree -->
      <PCard class="p-0">
        <template #content>
          <Flex justify="end" class="pb-2" gap="2">
            <DeleteButton
              :label="t('program.delete', 'Delete')"
              @click="handleDeletePrograms"
              v-if="treeTableRef?.hasSelectedRow()"
            />
            <AddButton :label="t('program.add', 'Add')" @click="handleAddProgram" />
          </Flex>

          <AppTreeDataTable
            ref="treeTableRef"
            :rows="programList"
            :columns="treeColumns"
            :total-records="totalRecords"
            :loading="isLoadingTree"
            :selectable="true"
            selection-mode="checkbox"
            row-key="pgmId"
            parent-key="prntPgmId"
            :table-height="350"
            @refresh="fetchData"
            @selection-change="(selected: ProgramDto[]) => { if (selected.length > 0) handleRowClick(selected[selected.length - 1]!) }"
          >
            <!-- pgmId as clickable link -->
            <template #body-pgmId="{ data }">
              <a
                class="text-primary cursor-pointer hover:underline"
                @click.stop="handlePgmIdClick(data)"
              >
                {{ data.pgmId }}
              </a>
            </template>

            <!-- useFlg display -->
            <template #body-useFlg="{ data }">
              <span>{{ data.useFlg === true ? 'Y' : 'N' }}</span>
            </template>
          </AppTreeDataTable>
        </template>
      </PCard>

      <!-- Right: Permissions -->
      <PCard class="p-0">
        <template #content>
          <template v-if="selectedPgmId">
            <Flex justify="end" class="pb-2" gap="2">
              <DeleteButton
                :label="t('program.deletePermission', 'Delete')"
                @click="handleDeletePermission"
                v-if="permTableRef?.hasSelectedRow()"
              />
              <AddButton :label="t('program.addPermission', 'Add')" @click="handleAddPermission" />
              <SaveButton
                :label="t('common.save', 'Save')"
                :loading="isSavingPerms"
                @click="handleSavePermissions"
              />
            </Flex>

            <AppDataTable
              ref="permTableRef"
              :rows="permRows"
              :columns="permColumns"
              :loading="isLoadingPerms"
              :editable="true"
              :selectable="true"
              selection-mode="checkbox"
              :table-height="350"
            />
          </template>

          <template v-else>
            <div class="flex items-center justify-center h-48 text-surface-400">
              {{ t('program.selectProgram', 'Select a program to view permissions') }}
            </div>
          </template>
        </template>
      </PCard>
    </div>

    <!-- Program Dialog -->
    <PDialog
      v-model:visible="dialogVisible"
      :header="dialogMode === 'create' ? t('program.createProgram', 'Create Program') : t('program.editProgram', 'Edit Program')"
      modal
      :style="{ width: '500px' }"
      :draggable="false"
    >
      <Form v-bind="dialogForm.formProps" :ref="(el: any) => { dialogForm.formRef = el }">
        <div class="flex flex-col gap-4 pt-2">
          <Input
            v-bind="dialogForm.field('pgmCd')"
            :label="t('program.pgmCd', 'Program Code')"
            float-label
            required
          />

          <Input
            v-bind="dialogForm.field('pgmNm')"
            :label="t('program.pgmNm', 'Program Name')"
            float-label
            required
          />

          <Select
            v-bind="dialogForm.field('pgmTpCd')"
            :label="t('program.pgmTpCd', 'Type')"
            :options="[{ label: 'MENU', value: 'MENU' }, { label: 'UI', value: 'UI' }]"
            option-label="label"
            option-value="value"
            float-label
            required
          />

          <Select
            v-bind="dialogForm.field('prntPgmId')"
            :label="t('program.prntPgmId', 'Parent Program')"
            :options="parentOptions"
            option-label="label"
            option-value="value"
            float-label
            show-clear
          />

          <InputNumber
            v-bind="dialogForm.field('dspOrder')"
            :label="t('program.dspOrder', 'Display Order')"
            float-label
          />

          <Input
            v-bind="dialogForm.field('pgmRmk')"
            :label="t('program.pgmRmk', 'Remark')"
            float-label
          />

          <CheckBox
            v-bind="dialogForm.field('useFlg')"
            :label="t('program.useFlg', 'Use Flag')"
            :true-value="true"
            :false-value="false"
          />
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <PButton
            :label="t('common.cancel', 'Cancel')"
            severity="secondary"
            @click="dialogVisible = false"
          />
          <PButton
            :label="t('common.save', 'Save')"
            type="submit"
            :loading="isDialogSaving"
          />
        </div>
      </Form>
    </PDialog>
  </div>
</template>
