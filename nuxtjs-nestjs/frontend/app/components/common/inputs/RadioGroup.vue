<script lang="ts" setup>
interface RadioGroupProps {
  /** v-model binding */
  modelValue?: unknown
  /** Label text — i18n key or raw text */
  label?: string
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
  /** Disabled state */
  disabled?: boolean
  /** Layout direction */
  direction?: 'vertical' | 'horizontal'
  /** HTML id */
  id?: string
  /** PrimeVue Form field name — enables automatic validation integration */
  name?: string
}

const props = withDefaults(defineProps<RadioGroupProps>(), {
  options: () => [],
  direction: 'vertical',
})

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const { t, te } = useI18n()

const _uid = useId()
const groupId = computed(() => props.id || `radiogroup-${_uid}`)

function getOptionLabel(option: unknown): string {
  if (props.optionLabel && typeof option === 'object' && option !== null) {
    return String((option as Record<string, unknown>)[props.optionLabel] ?? '')
  }
  return String(option)
}

function getOptionValue(option: unknown): unknown {
  if (props.optionValue && typeof option === 'object' && option !== null) {
    return (option as Record<string, unknown>)[props.optionValue]
  }
  return option
}

// --- PrimeVue Form integration ---
const $pcForm = inject('$pcForm', null) as any

if ($pcForm) {
  watch(() => props.name, (name) => {
    if (name) {
      $pcForm.register(name, { name })
    }
  }, { immediate: true })
}

const resolvedError = computed(() => {
  if (props.name && $pcForm) {
    const formError = $pcForm.fields?.[props.name]?.states?.error
    if (formError) return formError.message
  }
  const e = props.error
  if (!e) return undefined
  return te(e) ? t(e) : e
})

const hasError = computed(() => !!resolvedError.value)

const resolvedLabel = computed(() => {
  if (!props.label) return undefined
  return te(props.label) ? t(props.label) : props.label
})

const resolvedHint = computed(() => {
  if (!props.hint) return undefined
  return te(props.hint) ? t(props.hint) : props.hint
})
</script>

<template>
  <div class="flex flex-col gap-1">
    <label
      v-if="resolvedLabel"
      class="text-xs font-medium text-gray-700 dark:text-gray-300"
    >
      {{ resolvedLabel }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <div
      :class="[
        'flex gap-3',
        direction === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col',
      ]"
    >
      <RadioButton
        v-for="(option, index) in options"
        :key="index"
        :model-value="modelValue"
        :value="getOptionValue(option)"
        :label="getOptionLabel(option)"
        :name="name || groupId"
        :disabled="disabled"
        :invalid="hasError"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </div>

    <small v-if="resolvedError" class="text-red-500 text-xs">
      {{ resolvedError }}
    </small>
    <small
      v-else-if="resolvedHint"
      class="text-gray-400 dark:text-gray-500 text-xs"
    >
      {{ resolvedHint }}
    </small>
  </div>
</template>
