<script lang="ts" setup>
type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
type InputVariant = 'input' | 'textarea'

interface InputProps {
  /** v-model binding */
  modelValue?: string | number
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
  /** HTML input type */
  type?: InputType
  /** Render as textarea instead of input */
  variant?: InputVariant
  /** Textarea rows */
  rows?: number
  /** Disabled state */
  disabled?: boolean
  /** Fluid width (full container) */
  fluid?: boolean
  /** HTML id */
  id?: string
}

const props = withDefaults(defineProps<InputProps>(), {
  type: 'text',
  variant: 'input',
  rows: 3,
  fluid: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const { t, te } = useI18n()

const inputId = computed(() => props.id || `input-${useId()}`)

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
  >
    <PTextarea
      v-if="variant === 'textarea'"
      :id="inputId"
      :model-value="modelValue as string"
      :placeholder="resolvedPlaceholder"
      :rows="rows"
      :disabled="disabled"
      :fluid="fluid"
      :invalid="hasError"
      auto-resize
      @update:model-value="emit('update:modelValue', $event)"
    />
    <PInputText
      v-else
      :id="inputId"
      :model-value="modelValue"
      :type="type"
      :placeholder="resolvedPlaceholder"
      :disabled="disabled"
      :fluid="fluid"
      :invalid="hasError"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </FormField>
</template>
