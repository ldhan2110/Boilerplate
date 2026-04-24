<script lang="ts" setup>
interface CheckBoxProps {
  /** v-model binding */
  modelValue?: boolean | unknown[]
  /** Label text — i18n key or raw text */
  label?: string
  /** Error message */
  error?: string
  /** Hint text */
  hint?: string
  /** Show required asterisk */
  required?: boolean
  /** Value when used in array mode */
  value?: unknown
  /** Binary mode (true/false toggle) — default true */
  binary?: boolean
  /** Disabled state */
  disabled?: boolean
  /** HTML id */
  id?: string
}

const props = withDefaults(defineProps<CheckBoxProps>(), {
  binary: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean | unknown[]]
}>()

const { t, te } = useI18n()

const inputId = computed(() => props.id || `checkbox-${useId()}`)

const resolvedLabel = computed(() => {
  if (!props.label) return undefined
  return te(props.label) ? t(props.label) : props.label
})

const hasError = computed(() => !!props.error)
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="flex items-center gap-2">
      <PCheckbox
        :id="inputId"
        :model-value="modelValue"
        :value="value"
        :binary="binary"
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

    <small v-if="error" class="text-red-500 text-xs">
      {{ te(error) ? t(error) : error }}
    </small>
    <small
      v-else-if="hint"
      class="text-gray-400 dark:text-gray-500 text-xs"
    >
      {{ te(hint) ? t(hint) : hint }}
    </small>
  </div>
</template>
