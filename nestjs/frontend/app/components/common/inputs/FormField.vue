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
  /** PrimeVue Form field name — enables automatic validation integration */
  name?: string
  /** Use PrimeVue FloatLabel instead of stacked label — saves vertical space */
  floatLabel?: boolean
}

const props = defineProps<FormFieldProps>()

const { t, te } = useI18n()

/** Translate value if it looks like an i18n key */
function resolve(value: string | undefined): string | undefined {
  if (!value) return undefined
  return te(value) ? t(value) : value
}

const resolvedLabel = computed(() => resolve(props.label))
const resolvedHint = computed(() => resolve(props.hint))

// --- PrimeVue Form integration ---
const $pcForm = inject('$pcForm', null) as any

// Register field with PrimeVue Form when name is provided
if ($pcForm) {
  watch(() => props.name, (name) => {
    if (name) {
      $pcForm.register(name, { name })
    }
  }, { immediate: true })
}

// Read error from PrimeVue Form, fallback to explicit error prop
const resolvedError = computed(() => {
  if (props.name && $pcForm) {
    const formError = $pcForm.fields?.[props.name]?.states?.error
    if (formError) return formError.message
  }
  return resolve(props.error)
})
</script>

<template>
  <div class="flex flex-col gap-1">
    <!-- Float label mode -->
    <template v-if="floatLabel && resolvedLabel">
      <PFloatLabel variant="on">
        <slot />
        <label :for="inputId">
          {{ resolvedLabel }}
          <span v-if="required" class="text-red-500 ml-0.5">*</span>
        </label>
      </PFloatLabel>
    </template>

    <!-- Stacked label mode (default) -->
    <template v-else>
      <label
        v-if="resolvedLabel"
        :for="inputId"
        class="text-xs font-medium text-gray-700 dark:text-gray-300"
      >
        {{ resolvedLabel }}
        <span v-if="required" class="text-red-500 ml-0.5">*</span>
      </label>
      <slot />
    </template>

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
