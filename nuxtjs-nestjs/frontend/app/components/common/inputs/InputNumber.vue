<script lang="ts" setup>
interface InputNumberProps {
  /** v-model binding */
  modelValue?: number | null
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
  /** Disabled state */
  disabled?: boolean
  /** Fluid width (full container) */
  fluid?: boolean
  /** HTML id */
  id?: string
  /** Use FloatLabel instead of stacked label */
  floatLabel?: boolean
  /** PrimeVue Form field name — enables validation integration */
  name?: string
  /** Number format mode */
  mode?: 'decimal' | 'currency'
  /** Currency code (ISO 4217) — required when mode is 'currency' */
  currency?: string
  /** Currency display style */
  currencyDisplay?: 'symbol' | 'code' | 'name'
  /** Locale for formatting (e.g. 'en-US', 'vi-VN') */
  locale?: string
  /** Minimum fraction digits (0–20) */
  minFractionDigits?: number
  /** Maximum fraction digits (0–20) */
  maxFractionDigits?: number
  /** Minimum allowed value */
  min?: number
  /** Maximum allowed value */
  max?: number
  /** Step increment for buttons / arrow keys */
  step?: number
  /** Show increment/decrement buttons */
  showButtons?: boolean
  /** Button layout — 'stacked' | 'horizontal' | 'vertical' */
  buttonLayout?: 'stacked' | 'horizontal' | 'vertical'
  /** Prefix text (e.g. '$') */
  prefix?: string
  /** Suffix text (e.g. '%', 'kg') */
  suffix?: string
  /** Place label on the left, input on the right */
  horizontal?: boolean
}

const props = withDefaults(defineProps<InputNumberProps>(), {
  mode: 'decimal',
  step: 1,
  fluid: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const { t, te } = useI18n()

const _uid = useId()
const inputId = computed(() => props.id || `inputnumber-${_uid}`)

const resolvedPlaceholder = computed(() => {
  if (!props.placeholder) return undefined
  return te(props.placeholder) ? t(props.placeholder) : props.placeholder
})

const hasError = computed(() => !!props.error)
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
    :horizontal="horizontal"
  >
    <PInputNumber
      :id="inputId"
      :name="name"
      :model-value="modelValue"
      :placeholder="resolvedPlaceholder"
      :mode="mode"
      :currency="currency"
      :currency-display="currencyDisplay"
      :locale="locale"
      :min-fraction-digits="minFractionDigits"
      :max-fraction-digits="maxFractionDigits"
      :min="min"
      :max="max"
      :step="step"
      :show-buttons="showButtons"
      :button-layout="buttonLayout"
      :prefix="prefix"
      :suffix="suffix"
      :disabled="disabled"
      :fluid="fluid"
      :invalid="hasError"
      size="small"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </FormField>
</template>
