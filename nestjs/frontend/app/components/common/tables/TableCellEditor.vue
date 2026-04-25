<script setup lang="ts">
import type { ColumnDef } from '~/types/table'

const props = defineProps<{
  value: any
  field: string
  row: any
  colDef: ColumnDef
  options?: any[]
}>()

const emit = defineEmits<{
  (e: 'update:value', value: any): void
}>()

const inputRef = ref<any>(null)

const editType = computed(() => props.colDef.editType ?? 'input')
const editProps = computed(() => props.colDef.editProps ?? {})
const editOptions = computed(() => props.options ?? props.colDef.editOptions ?? [])

const localValue = computed({
  get: () => props.value,
  set: (val) => emit('update:value', val),
})

onMounted(() => {
  nextTick(() => {
    const el = inputRef.value?.$el?.querySelector('input') ?? inputRef.value?.$el
    el?.focus()
  })
})
</script>

<template>
  <PInputText
    v-if="editType === 'input'"
    ref="inputRef"
    v-model="localValue"
    v-bind="editProps"
    class="w-full"
  />
  <PInputNumber
    v-else-if="editType === 'number'"
    ref="inputRef"
    v-model="localValue"
    v-bind="editProps"
    class="w-full"
  />
  <PDatePicker
    v-else-if="editType === 'date'"
    ref="inputRef"
    v-model="localValue"
    v-bind="editProps"
    class="w-full"
  />
  <PSelect
    v-else-if="editType === 'select'"
    ref="inputRef"
    v-model="localValue"
    :options="editOptions"
    v-bind="editProps"
    class="w-full"
  />
  <PMultiSelect
    v-else-if="editType === 'multiselect'"
    ref="inputRef"
    v-model="localValue"
    :options="editOptions"
    v-bind="editProps"
    class="w-full"
  />
  <PInputText
    v-else
    ref="inputRef"
    v-model="localValue"
    class="w-full"
  />
</template>
