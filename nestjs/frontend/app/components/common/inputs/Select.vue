<script lang="ts" setup>
interface SelectProps {
  /** v-model binding */
  modelValue?: unknown
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
  /** Array of options */
  options?: unknown[]
  /** Property name for option label */
  optionLabel?: string
  /** Property name for option value */
  optionValue?: string
  /** Enable search filter */
  filterable?: boolean
  /** Filter placeholder — i18n key or raw text */
  filterPlaceholder?: string
  /** Disabled state */
  disabled?: boolean
  /** Show clear button */
  showClear?: boolean
  /** Fluid width (full container) */
  fluid?: boolean
  /** HTML id */
  id?: string
  /** Enable multiselect mode */
  multiple?: boolean
}

const props = withDefaults(defineProps<SelectProps>(), {
  options: () => [],
  filterable: false,
  showClear: false,
  fluid: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const { t, te } = useI18n()

const inputId = computed(() => props.id || `select-${useId()}`)

function resolve(value: string | undefined, fallbackKey?: string): string | undefined {
  const v = value || fallbackKey
  if (!v) return undefined
  return te(v) ? t(v) : v
}

const resolvedPlaceholder = computed(() => resolve(props.placeholder, 'common.selectPlaceholder'))
const resolvedFilterPlaceholder = computed(() => resolve(props.filterPlaceholder, 'common.search'))

const hasError = computed(() => !!props.error)
</script>

<template>
  <FormField
    :label="label"
    :error="error"
    :hint="hint"
    :required="required"
    :input-id="inputId"
  >
    <PMultiSelect
      v-if="multiple"
      :id="inputId"
      :model-value="modelValue"
      :options="options"
      :option-label="optionLabel"
      :option-value="optionValue"
      :placeholder="resolvedPlaceholder"
      :filter="filterable"
      :filter-placeholder="resolvedFilterPlaceholder"
      :disabled="disabled"
      :show-clear="showClear"
      :fluid="fluid"
      :invalid="hasError"
      size="small"
      display="chip"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <PSelect
      v-else
      :id="inputId"
      :model-value="modelValue"
      :options="options"
      :option-label="optionLabel"
      :option-value="optionValue"
      :placeholder="resolvedPlaceholder"
      :filter="filterable"
      :filter-placeholder="resolvedFilterPlaceholder"
      :disabled="disabled"
      :show-clear="showClear"
      :fluid="fluid"
      :invalid="hasError"
      size="small"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </FormField>
</template>
