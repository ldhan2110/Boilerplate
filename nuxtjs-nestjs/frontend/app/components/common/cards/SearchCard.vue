<script lang="ts" setup>
type ResponsiveCols = {
  base?: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
}

interface SearchCardProps {
  form: ReturnType<typeof useAppForm>
  autoSearch?: boolean
  debounce?: number
  cols?: number | ResponsiveCols
  minChildWidth?: string
}

const props = withDefaults(defineProps<SearchCardProps>(), {
  autoSearch: false,
  debounce: 300,
  minChildWidth: '200px'
})

const emit = defineEmits<{
  search: [values: Record<string, unknown>]
}>()

// Auto-search with debounce
let debounceTimer: ReturnType<typeof setTimeout> | null = null

if (props.autoSearch) {
  watch(
    () => props.form.values,
    () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        emit('search', { ...props.form.values })
      }, props.debounce)
    },
    { deep: true }
  )
}

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

// Compute grid props: when cols provided use that, otherwise use minChildWidth auto-fill
const gridCols = computed(() => props.cols)
const gridMinChildWidth = computed(() => (!props.cols ? props.minChildWidth : undefined))

// Form submit handler — only used when autoSearch is false
const wrappedFormProps = computed(() => {
  if (props.autoSearch) return props.form.formProps.value
  return {
    ...props.form.formProps.value,
    onSubmit: (e: { valid: boolean, values: Record<string, unknown> }) => {
      props.form.formProps.value.onSubmit?.(e)
      if (e.valid) {
        emit('search', { ...props.form.values })
      }
    }
  }
})
</script>

<template>
  <PCard>
    <template #content>
      <Form
        :ref="form.formRef"
        v-bind="wrappedFormProps"
      >
        <Grid
          :cols="gridCols"
          :min-child-width="gridMinChildWidth"
          gap="4"
        >
          <slot />
        </Grid>

        <!-- Action buttons row — always at bottom right -->
        <div class="mt-4 flex justify-end gap-2">
          <Button
            v-if="!autoSearch"
            type="submit"
            label="Search"
            icon="pi pi-search"
            size="sm"
          />
          <Button
            type="button"
            label="Refresh"
            icon="pi pi-refresh"
            variant="secondary"
            outlined
            size="sm"
            @click="form.resetForm(); emit('search', { ...form.values })"
          />
        </div>
      </Form>
    </template>
  </PCard>
</template>
