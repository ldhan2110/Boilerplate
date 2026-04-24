<script lang="ts" setup>
interface FormFieldProps {
  /** Label text — accepts i18n key or raw text */
  label?: string
  /** Error message — accepts i18n key or raw text */
  error?: string
  /** Hint text below input — hidden when error is shown */
  hint?: string
  /** Show required asterisk on label */
  required?: boolean
  /** HTML id for the input (for label association) */
  inputId?: string
}

const props = defineProps<FormFieldProps>()

const { t, te } = useI18n()

/** Translate value if it looks like an i18n key */
function resolve(value: string | undefined): string | undefined {
  if (!value) return undefined
  return te(value) ? t(value) : value
}

const resolvedLabel = computed(() => resolve(props.label))
const resolvedError = computed(() => resolve(props.error))
const resolvedHint = computed(() => resolve(props.hint))
</script>

<template>
  <div class="flex flex-col gap-1">
    <label
      v-if="resolvedLabel"
      :for="inputId"
      class="text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ resolvedLabel }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <slot />

    <small
      v-if="resolvedError"
      class="text-red-500 text-xs"
    >
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
