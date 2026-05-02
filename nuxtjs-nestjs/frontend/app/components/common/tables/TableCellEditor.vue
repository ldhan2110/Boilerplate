<script setup lang="ts">
import type { ColumnDef } from '~/types/table'
import { toDateString, fromDateString } from '~/utils'

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

/** For date-only: convert string value to Date for PrimeVue picker */
const dateValue = computed(() => {
  if (!isDateType.value || localValue.value == null) return null
  if (localValue.value instanceof Date) return localValue.value
  if (typeof localValue.value === 'string') {
    return fromDateString(localValue.value, dateVariant.value)
  }
  return null
})

/** Enforce HH:mm format on time input */
function onTimeInput(event: Event) {
  const input = event.target as HTMLInputElement
  let raw = input.value.replace(/[^\d]/g, '').slice(0, 4)

  // Clamp hours
  if (raw.length >= 2) {
    let hh = parseInt(raw.slice(0, 2), 10)
    if (hh > 23) hh = 23
    raw = hh.toString().padStart(2, '0') + raw.slice(2)
  }

  // Clamp minutes
  if (raw.length >= 4) {
    let mm = parseInt(raw.slice(2, 4), 10)
    if (mm > 59) mm = 59
    raw = raw.slice(0, 2) + mm.toString().padStart(2, '0')
  }

  // Insert colon
  const formatted = raw.length > 2 ? raw.slice(0, 2) + ':' + raw.slice(2) : raw
  input.value = formatted
  emit('update:value', formatted)
}

/** Block non-digit and non-colon keys in time input */
function onTimeKeydown(e: KeyboardEvent) {
  // Allow navigation/control keys
  if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', 'Escape'].includes(e.key)) return
  // Allow Ctrl/Cmd shortcuts
  if (e.ctrlKey || e.metaKey) return
  // Block non-digits
  if (!/^\d$/.test(e.key)) {
    e.preventDefault()
  }
}

/** Convert PrimeVue Date back to string and emit (date-only picker) */
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

    // PDatePicker (date / datetime): focus input without opening popup
    if (editType.value === 'date' || editType.value === 'datetime') {
      const dateInput: HTMLInputElement | null = root.querySelector?.('input') ?? root
      if (dateInput?.focus) {
        const blocker = (e: FocusEvent) => e.stopImmediatePropagation()
        dateInput.addEventListener('focus', blocker, { capture: true, once: true })
        dateInput.focus()
      }
      return
    }

    // Standard inputs (including datetime/time which now use PInputText)
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
    hour-format="24"
    manual-input
    v-bind="editProps"
    class="w-full"
    @update:model-value="onDateUpdate"
  />
  <!-- time: validated HH:mm input with clock icon -->
  <PIconField v-else-if="editType === 'time'" ref="inputRef" icon-position="right">
    <PInputText
      :model-value="localValue"
      placeholder="HH:mm"
      maxlength="5"
      v-bind="editProps"
      class="w-full"
      @input="onTimeInput"
      @keydown="onTimeKeydown"
    />
    <PInputIcon class="pi pi-clock" />
  </PIconField>
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
