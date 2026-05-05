<script lang="ts" setup>
import { markRaw } from 'vue'
import z from 'zod'
import { useUserManagementStore } from '~/stores/modules/administration'

const store = useUserManagementStore()
const { t } = useI18n()

const searchSchema = z.object({
  searchText: z.string().optional(),
  useFlg: z.string().nullable().optional(),
})

const searchForm = markRaw(useAppForm({
  schema: searchSchema,
  initialValues: { searchText: '', useFlg: null },
  onSubmit: () => {},
  guard: false,
}))

const statusOptions = computed(() => [
  { label: t('common.all'), value: '' },
  { label: t('common.active'), value: 'Y' },
  { label: t('common.inactive'), value: 'N' },
])

function onSearch(values: Record<string, unknown>) {
  store.handleSearch(values)
}
</script>

<template>
  <SearchCard :form="searchForm" @search="onSearch" class="pt-2">
    <Input
      v-bind="searchForm.field('searchText')"
      :label="t('common.search')"
      float-label
    />

    <Select
      v-bind="searchForm.field('useFlg')"
      :label="t('common.status')"
      :options="statusOptions"
      option-label="label"
      option-value="value"
      float-label
    />
  </SearchCard>
</template>
