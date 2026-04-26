<script lang="ts" setup>
interface ToggleProps {
  /** v-model binding */
  modelValue?: any
  /** Label text — i18n key or raw text */
  label?: string
  /** Error message */
  error?: string
  /** Hint text */
  hint?: string
  /** Show required asterisk */
  required?: boolean
  /** Value when on (default: true) */
  trueValue?: unknown
  /** Value when off (default: false) */
  falseValue?: unknown
  /** Disabled state */
  disabled?: boolean
  /** HTML id */
  id?: string
  /** PrimeVue Form field name — enables automatic validation integration */
  name?: string
}

const props = defineProps<ToggleProps>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const { t, te } = useI18n()

const inputId = computed(() => props.id || `toggle-${useId()}`)

const resolvedLabel = computed(() => {
  if (!props.label) return undefined
  return te(props.label) ? t(props.label) : props.label
})

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
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="flex items-center gap-2">
      <PToggleSwitch
        :input-id="inputId"
        :model-value="modelValue"
        :true-value="trueValue"
        :false-value="falseValue"
        :disabled="disabled"
        :invalid="hasError"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <label
        v-if="resolvedLabel"
        :for="inputId"
        class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
      >
        {{ resolvedLabel }}
        <span v-if="required" class="text-red-500 ml-0.5">*</span>
      </label>
    </div>

    <small v-if="resolvedError" class="text-red-500 text-xs">
      {{ resolvedError }}
    </small>
    <small
      v-else-if="hint"
      class="text-gray-400 dark:text-gray-500 text-xs"
    >
      {{ te(hint) ? t(hint) : hint }}
    </small>
  </div>
</template>
