<script lang="ts" setup>
interface DatePickerProps {
  /** v-model binding */
  modelValue?: Date | Date[] | null
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
  /** Enable range selection */
  range?: boolean
  /** Show time picker */
  showTime?: boolean
  /** Time only mode */
  timeOnly?: boolean
  /** Date format */
  dateFormat?: string
  /** Minimum selectable date */
  minDate?: Date
  /** Maximum selectable date */
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
}

const props = withDefaults(defineProps<DatePickerProps>(), {
  dateFormat: 'dd/mm/yy',
  showButtonBar: true,
  fluid: true,
  showIcon: true,
  iconDisplay: 'input',
})

const emit = defineEmits<{
  'update:modelValue': [value: Date | Date[] | null]
}>()

const { t, te } = useI18n()

const inputId = computed(() => props.id || `datepicker-${useId()}`)

const resolvedPlaceholder = computed(() => {
  const v = props.placeholder || 'common.datePlaceholder'
  return te(v) ? t(v) : v
})

const hasError = computed(() => !!props.error)

const selectionMode = computed(() => {
  if (props.range) return 'range'
  return 'single'
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
  >
    <PDatePicker
      :id="inputId"
      :model-value="modelValue"
      :placeholder="resolvedPlaceholder"
      :selection-mode="selectionMode"
      :show-time="showTime"
      :time-only="timeOnly"
      :date-format="dateFormat"
      :min-date="minDate"
      :max-date="maxDate"
      :show-button-bar="showButtonBar"
      :disabled="disabled"
      :fluid="fluid"
      :show-icon="showIcon"
      :icon-display="iconDisplay"
      :invalid="hasError"
      size="small"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </FormField>
</template>
