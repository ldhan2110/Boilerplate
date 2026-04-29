<script lang="ts" setup>
import { toDateString, fromDateString } from '~/utils/date'

type DatePickerVariant = 'date' | 'datetime' | 'time'

interface DatePickerProps {
  /** v-model binding — string in dd/mm/yyyy, hh:mm, or dd/mm/yyyy hh:mm format */
  modelValue?: string | string[] | null
  /** Label text — i18n key or raw text */
  label?: string
  /** Placeholder — i18n key or raw text */
  placeholder?: string
  /** Error message */
  error?: string
  /** Hint text */
  hint?: string
  /** Show required asterisk */
  required?: boolean
  /** Picker variant: date, datetime, or time */
  variant?: DatePickerVariant
  /** Enable range selection (date/datetime only) */
  range?: boolean
  /** Date format (date/datetime only) */
  dateFormat?: string
  /** Minimum selectable date (date/datetime only) */
  minDate?: Date
  /** Maximum selectable date (date/datetime only) */
  maxDate?: Date
  /** Show button bar (Today / Clear) */
  showButtonBar?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Fluid width (full container) */
  fluid?: boolean
  /** Show icon trigger */
  showIcon?: boolean
  /** Icon display mode */
  iconDisplay?: 'input' | 'button'
  /** HTML id */
  id?: string
  /** Use FloatLabel instead of stacked label */
  floatLabel?: boolean
  /** PrimeVue Form field name — enables validation integration */
  name?: string
}

const props = withDefaults(defineProps<DatePickerProps>(), {
  variant: 'date',
  dateFormat: 'dd/mm/yy',
  showButtonBar: true,
  fluid: true,
  showIcon: true,
  iconDisplay: 'input'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | null]
}>()

const { t, te } = useI18n()

const _uid = useId()
const inputId = computed(() => props.id || `datepicker-${_uid}`)

const defaultPlaceholders: Record<DatePickerVariant, string> = {
  date: 'common.datePlaceholder',
  datetime: 'common.dateTimePlaceholder',
  time: 'common.timePlaceholder'
}

const resolvedPlaceholder = computed(() => {
  const v = props.placeholder || defaultPlaceholders[props.variant]
  return te(v) ? t(v) : v
})

const hasError = computed(() => !!props.error)

const isTimeOnly = computed(() => props.variant === 'time')
const showTime = computed(() => props.variant === 'datetime')

const selectionMode = computed(() => {
  if (props.range && !isTimeOnly.value) return 'range'
  return 'single'
})

/** Convert string modelValue to Date for PrimeVue picker */
const internalValue = computed(() => {
  const mv = props.modelValue
  if (mv == null) return null

  if (props.range && Array.isArray(mv)) {
    return mv.map(s => fromDateString(s, props.variant)).filter(Boolean) as Date[]
  }

  if (typeof mv === 'string') {
    return fromDateString(mv, props.variant)
  }

  return null
})

/** Convert PrimeVue Date output back to string */
function onPickerUpdate(val: Date | Date[] | (Date | null)[] | null | undefined) {
  if (val == null) {
    emit('update:modelValue', null)
    return
  }

  if (Array.isArray(val)) {
    emit('update:modelValue', val.map(d => d ? toDateString(d, props.variant) : ''))
    return
  }

  emit('update:modelValue', toDateString(val, props.variant))
}

const pickerRef = ref<any>(null)

/** Workaround: PrimeVue bug — parseDateTime throws for 24h time format,
 *  so manual input never calls updateModel. We parse typed text ourselves:
 *  - On input: emit immediately when valid (keeps model in sync)
 *  - On blur: re-apply value + fix DOM after PrimeVue reverts display */
onMounted(() => {
  if (props.variant !== 'datetime' && props.variant !== 'time') return

  nextTick(() => {
    const root = pickerRef.value?.$el
    const inputEl: HTMLInputElement | null = root?.querySelector?.('input')
    if (!inputEl) return

    let lastTyped = ''

    inputEl.addEventListener('input', () => {
      lastTyped = inputEl.value ?? ''
      const text = lastTyped.trim()
      if (!text) return
      const parsed = fromDateString(text, props.variant)
      if (parsed) {
        emit('update:modelValue', toDateString(parsed, props.variant))
      }
    })

    inputEl.addEventListener('blur', () => {
      const text = (lastTyped || inputEl.value)?.trim()
      if (!text) return
      setTimeout(() => {
        const parsed = fromDateString(text, props.variant)
        if (parsed) {
          const formatted = toDateString(parsed, props.variant)
          emit('update:modelValue', formatted)
          inputEl.value = formatted
        }
      }, 0)
    })
  })
})
</script>

<template>
  <FormField
    :label="label"
    :error="error"
    :hint="hint"
    :required="required"
    :input-id="inputId"
    :float-label="floatLabel"
    :name="name"
  >
    <PDatePicker
      :id="inputId"
      :name="name"
      ref="pickerRef"
      :model-value="internalValue"
      :placeholder="resolvedPlaceholder"
      :selection-mode="selectionMode"
      :show-time="showTime"
      :time-only="isTimeOnly"
      :date-format="isTimeOnly ? undefined : dateFormat"
      :min-date="isTimeOnly ? undefined : minDate"
      :max-date="isTimeOnly ? undefined : maxDate"
      :show-button-bar="showButtonBar"
      :disabled="disabled"
      :fluid="fluid"
      :show-icon="showIcon"
      :icon-display="iconDisplay"
      :invalid="hasError"
      manual-input
      size="small"
      @update:model-value="onPickerUpdate"
    />
  </FormField>
</template>
