<script lang="ts" setup>
interface RadioButtonProps {
  /** v-model binding */
  modelValue?: unknown
  /** The value this radio represents */
  value?: unknown
  /** Label text — i18n key or raw text */
  label?: string
  /** Disabled state */
  disabled?: boolean
  /** Invalid state */
  invalid?: boolean
  /** HTML id */
  id?: string
  /** HTML name attribute — groups radios together */
  name?: string
}

const props = defineProps<RadioButtonProps>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const { t, te } = useI18n()

const _uid = useId()
const inputId = computed(() => props.id || `radio-${_uid}`)

const resolvedLabel = computed(() => {
  if (!props.label) return undefined
  return te(props.label) ? t(props.label) : props.label
})
</script>

<template>
  <div class="flex items-center gap-2">
    <PRadioButton
      :id="inputId"
      :model-value="modelValue"
      :value="value"
      :name="name"
      :disabled="disabled"
      :invalid="invalid"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <label
      v-if="resolvedLabel"
      :for="inputId"
      class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
    >
      {{ resolvedLabel }}
    </label>
  </div>
</template>
