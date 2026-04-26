<script setup lang="ts">
import type { ColumnDef } from '~/types/table'
import { toDateString, fromDateString } from '~/utils/date'

type DateVariant = 'date' | 'datetime' | 'time'

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

const isDateType = computed(() => editType.value === 'date' || editType.value === 'datetime' || editType.value === 'time')
const dateVariant = computed<DateVariant>(() => editType.value as DateVariant)

const localValue = computed({
  get: () => props.value,
  set: val => emit('update:value', val)
})

/** For date types: convert string value to Date for PrimeVue picker */
const dateValue = computed(() => {
  if (!isDateType.value || localValue.value == null) return null
  if (localValue.value instanceof Date) return localValue.value
  if (typeof localValue.value === 'string') {
    return fromDateString(localValue.value, dateVariant.value)
  }
  return null
})

/** Convert PrimeVue Date back to string and emit */
function onDateUpdate(val: Date | Date[] | (Date | null)[] | null | undefined) {
  if (val == null) {
    emit('update:value', null)
    return
  }
  const d = Array.isArray(val) ? val[0] : val
  if (!d) { emit('update:value', null); return }
  emit('update:value', toDateString(d, dateVariant.value))
}

onMounted(() => {
  nextTick(() => {
    // Checkbox/toggle: no focus needed, they work via click
    if (editType.value === 'checkbox' || editType.value === 'toggle') return

    const root = inputRef.value?.$el
    if (!root) return

    // PSelect / PMultiSelect: focus the combobox span
    const combobox = root.querySelector?.('[role="combobox"]') ?? (root.getAttribute?.('role') === 'combobox' ? root : null)
    if (combobox) {
      combobox.focus()
      return
    }

    // PDatePicker: focus input without opening popup
    if (isDateType.value) {
      const dateInput: HTMLInputElement | null = root.querySelector?.('input') ?? root
      if (dateInput?.focus) {
        const blocker = (e: FocusEvent) => e.stopImmediatePropagation()
        dateInput.addEventListener('focus', blocker, { capture: true, once: true })
        dateInput.focus()
      }

      // Workaround: PrimeVue bug — manualInput + showTime/timeOnly reverts on blur.
      if (editType.value === 'datetime' || editType.value === 'time') {
        const inputEl: HTMLInputElement | null = root.querySelector?.('input')
        if (inputEl) {
          inputEl.addEventListener('blur', () => {
            const text = inputEl.value?.trim()
            if (!text) return
            nextTick(() => {
              const parsed = fromDateString(text, dateVariant.value)
              if (parsed) {
                emit('update:value', toDateString(parsed, dateVariant.value))
              }
            })
          })
        }
      }
      return
    }

    // Standard inputs
    const el = root.querySelector?.('input') ?? root
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
    :model-value="dateValue"
    date-format="dd/mm/yy"
    manual-input
    v-bind="editProps"
    class="w-full"
    @update:model-value="onDateUpdate"
  />
  <PDatePicker
    v-else-if="editType === 'datetime'"
    ref="inputRef"
    :model-value="dateValue"
    date-format="dd/mm/yy"
    show-time
    manual-input
    v-bind="editProps"
    class="w-full"
    @update:model-value="onDateUpdate"
  />
  <PDatePicker
    v-else-if="editType === 'time'"
    ref="inputRef"
    :model-value="dateValue"
    time-only
    manual-input
    v-bind="editProps"
    class="w-full"
    @update:model-value="onDateUpdate"
  />
  <PSelect
    v-else-if="editType === 'select'"
    ref="inputRef"
    v-model="localValue"
    :options="editOptions"
    filter
    show-clear
    reset-filter-on-clear
    v-bind="editProps"
    class="w-full"
  />
  <PMultiSelect
    v-else-if="editType === 'multiselect'"
    ref="inputRef"
    v-model="localValue"
    :options="editOptions"
    filter
    show-clear
    reset-filter-on-clear
    v-bind="editProps"
    class="w-full"
  />
  <div
    v-else-if="editType === 'checkbox'"
    ref="inputRef"
    class="flex items-center justify-center w-full px-2 py-1"
  >
    <PCheckbox
      v-model="localValue"
      :binary="true"
      v-bind="editProps"
    />
  </div>
  <div
    v-else-if="editType === 'toggle'"
    ref="inputRef"
    class="flex items-center justify-center w-full px-2 py-1"
  >
    <PToggleSwitch
      v-model="localValue"
      v-bind="editProps"
    />
  </div>
  <PInputText
    v-else
    ref="inputRef"
    v-model="localValue"
    class="w-full"
  />
</template>
