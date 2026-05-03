<script lang="ts" setup>
import { useUserManagementStore } from '~/stores/modules/administration'

const store = useUserManagementStore()
const { t } = useI18n()
</script>

<template>
  <SearchCard :form="store.searchForm" @search="store.handleSearch" class="pt-2">
    <Input
      v-bind="store.searchForm.field('searchText')"
      :label="t('common.search')"
      float-label
    />

    <Select
      v-bind="store.searchForm.field('useFlg')"
      :label="t('common.status')"
      :options="store.statusOptions"
      option-label="label"
      option-value="value"
      float-label
    />
  </SearchCard>
</template>
