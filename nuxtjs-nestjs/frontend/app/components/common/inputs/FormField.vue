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
  /** Place label on the left, input on the right — single-line layout */
  horizontal?: boolean
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
  <div :class="horizontal ? 'flex flex-row items-start gap-2' : 'flex flex-col gap-0.5'">
    <!-- Float label mode -->
    <template v-if="floatLabel && resolvedLabel && !horizontal">
      <PFloatLabel variant="on">
        <slot />
        <label :for="inputId">
          {{ resolvedLabel }}
          <span v-if="required" class="text-red-500 ml-0.5">*</span>
        </label>
      </PFloatLabel>
    </template>

    <!-- Stacked / horizontal label mode -->
    <template v-else>
      <label
        v-if="resolvedLabel"
        :for="inputId"
        :class="[
          'text-[0.6875rem] font-medium text-gray-700 dark:text-gray-300 leading-tight',
          horizontal ? 'w-32 shrink-0 pt-1.5 text-right' : ''
        ]"
      >
        {{ resolvedLabel }}
        <span v-if="required" class="text-red-500 ml-0.5">*</span>
      </label>

      <!-- Wrap input + feedback when horizontal so they stack in right column -->
      <div v-if="horizontal" class="flex-1 flex flex-col gap-0.5">
        <slot />
        <small v-if="resolvedError" class="text-red-500 text-xs">
          {{ resolvedError }}
        </small>
        <small v-else-if="resolvedHint" class="text-gray-400 dark:text-gray-500 text-xs">
          {{ resolvedHint }}
        </small>
      </div>
      <template v-else>
        <slot />
      </template>
    </template>

    <!-- Feedback for non-horizontal (outside inner template) -->
    <template v-if="!horizontal">
      <small v-if="resolvedError" class="text-red-500 text-xs">
        {{ resolvedError }}
      </small>
      <small v-else-if="resolvedHint" class="text-gray-400 dark:text-gray-500 text-xs">
        {{ resolvedHint }}
      </small>
    </template>
  </div>
</template>
