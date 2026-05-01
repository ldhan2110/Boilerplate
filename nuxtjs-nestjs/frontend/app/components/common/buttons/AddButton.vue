<script lang="ts" setup>
interface AddButtonProps {
  /** Pass-through loading state */
  loading?: boolean
  /** Pass-through disabled state */
  disabled?: boolean
  /** Button label override (i18n key or raw text) */
  label?: string
  /** Button icon override */
  icon?: string
}

const props = withDefaults(defineProps<AddButtonProps>(), {
  label: 'common.add',
  icon: 'pi pi-plus',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <Button
    :label="label"
    :icon="icon"
    :loading="loading"
    :disabled="disabled"
    outlined
    @click="emit('click', $event)"
  />
</template>
