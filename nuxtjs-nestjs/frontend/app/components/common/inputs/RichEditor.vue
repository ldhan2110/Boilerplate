<script lang="ts" setup>
interface RichEditorProps {
  /** v-model binding (HTML string) */
  modelValue?: string
  /** Label text — i18n key or raw text */
  label?: string
  /** Error message */
  error?: string
  /** Hint text */
  hint?: string
  /** Show required asterisk */
  required?: boolean
  /** Editor height in px */
  height?: number
  /** Disabled / readonly state */
  disabled?: boolean
  /** HTML id */
  id?: string
  /** PrimeVue Form field name — enables validation integration */
  name?: string
}

const props = withDefaults(defineProps<RichEditorProps>(), {
  height: 200,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const _uid = useId()
const inputId = computed(() => props.id || `editor-${_uid}`)

const editorStyle = computed(() => ({
  height: `${props.height}px`,
}))
</script>

<template>
  <FormField
    :label="label"
    :error="error"
    :hint="hint"
    :required="required"
    :input-id="inputId"
    :name="name"
  >
    <ClientOnly>
      <PEditor
        :id="inputId"
        :model-value="modelValue"
        :readonly="disabled"
        :editor-style="editorStyle"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <template #fallback>
        <div
          class="border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 flex items-center justify-center"
          :style="{ height: `${height + 42}px` }"
        >
          <span class="text-xs text-gray-400">Loading editor...</span>
        </div>
      </template>
    </ClientOnly>
  </FormField>
</template>

<style>
@import "quill/dist/quill.snow.css";
</style>
