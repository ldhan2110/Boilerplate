<script lang="ts" setup>
import { useProgramManagementStore } from '~/stores/modules/administration'

const store = useProgramManagementStore()
const { t } = useI18n()
</script>

<template>
  <PDialog
    v-model:visible="store.dialogVisible"
    :header="store.dialogMode === 'create' ? t('program.createProgram') : t('program.editProgram')"
    modal
    :style="{ width: '500px' }"
    :draggable="false"
  >
    <PForm :ref="store.dialogForm.formRef" v-bind="store.dialogForm.formProps" @submit="store.dialogForm.handleSubmit">
      <div class="flex flex-col gap-4 pt-2">
        <Input
          v-bind="store.dialogForm.field('pgmCd')"
          :label="t('program.pgmCd')"
          float-label
          required
          :disabled="store.dialogMode === 'edit'"
        />

        <Input
          v-bind="store.dialogForm.field('pgmNm')"
          :label="t('program.pgmNm')"
          float-label
          required
        />

        <Select
          v-bind="store.dialogForm.field('pgmTpCd')"
          :label="t('program.pgmTpCd')"
          :options="[{ label: 'MENU', value: 'MENU' }, { label: 'UI', value: 'UI' }]"
          option-label="label"
          option-value="value"
          float-label
          required
        />

        <Select
          v-bind="store.dialogForm.field('prntPgmId')"
          :label="t('program.prntPgmId')"
          :options="store.parentOptions"
          option-label="label"
          option-value="value"
          float-label
          show-clear
        />

        <Input
          v-bind="store.dialogForm.field('pgmPath')"
          :label="t('program.pgmPath')"
          float-label
          required
        />

        <InputNumber
          v-bind="store.dialogForm.field('dspOrder')"
          :label="t('program.dspOrder')"
          float-label
        />

        <Input
          v-bind="store.dialogForm.field('pgmRmk')"
          :label="t('program.pgmRmk')"
          variant="textarea"
          float-label
        />

        <CheckBox
          v-bind="store.dialogForm.field('useFlg')"
          :label="t('program.useFlg')"
          true-value="Y"
          false-value="N"
        />
      </div>

      <div class="flex justify-end gap-2 pt-4">
        <PButton
          :label="t('common.cancel')"
          severity="secondary"
          @click="store.closeDialog"
        />
        <SaveButton
          :label="t('common.save')"
          :loading="store.isDialogSaving"
          type="submit"
        />
      </div>
    </PForm>
  </PDialog>
</template>
