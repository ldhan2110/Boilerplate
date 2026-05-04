<script lang="ts" setup>
import z from 'zod'

const emit = defineEmits<{
  search: [params: Record<string, any>]
}>()

const { t } = useI18n()

const statusOptions = computed(() => [
  { label: t('common.all'), value: '' },
  { label: t('common.active'), value: 'Y' },
  { label: t('common.inactive'), value: 'N' },
])

const searchSchema = z.object({
  searchText: z.string().nullable().optional(),
  useFlg: z.string().nullable().optional(),
})

const searchForm = markRaw(useAppForm({
  schema: searchSchema,
  initialValues: { searchText: '', useFlg: '' },
  onSubmit: () => {},
  guard: false,
}))

function handleSearch() {
  const values = searchForm.values
  const params: Record<string, any> = {}
  if (values.searchText) params.searchText = values.searchText
  if (values.useFlg) params.useFlg = values.useFlg
  emit('search', params)
}
</script>

<template>
  <SearchCard :form="searchForm" @search="handleSearch" class="pt-2">
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
