<script lang="ts" setup>
import { useProgramManagementStore } from '~/stores/modules/administration'

const store = useProgramManagementStore()
const { t } = useI18n()
</script>

<template>
  <SearchCard :form="store.searchForm" @search="store.handleSearch" class="pt-2">
    <Input
      v-bind="store.searchForm.field('pgmNm')"
      :label="t('program.pgmNm')"
      float-label
    />

    <Select
      v-bind="store.searchForm.field('pgmTpCd')"
      :label="t('program.pgmTpCd')"
      :options="store.typeOptions"
      option-label="label"
      option-value="value"
      float-label
    />

    <Select
      v-bind="store.searchForm.field('useFlg')"
      :label="t('common.status')"
      :options="store.statusOptions"
      true-value="Y"
      false-value="N"
      option-label="label"
      option-value="value"
      float-label
    />
  </SearchCard>
</template>
