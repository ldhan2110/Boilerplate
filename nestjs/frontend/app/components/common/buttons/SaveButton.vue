<script lang="ts" setup>
import { useConfirm } from 'primevue/useconfirm'

interface SaveButtonProps {
  /** Show confirmation dialog before triggering click */
  showConfirm?: boolean
  /** Confirmation dialog header */
  header?: string
  /** Confirmation dialog message */
  message?: string
  /** Accept button label */
  acceptLabel?: string
  /** Reject button label */
  rejectLabel?: string
  /** Pass-through loading state */
  loading?: boolean
  /** Pass-through disabled state */
  disabled?: boolean
  /** Button label override */
  label?: string
  /** Button icon override */
  icon?: string
}

const props = withDefaults(defineProps<SaveButtonProps>(), {
  showConfirm: false,
  label: 'common.save',
  icon: 'pi pi-save',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const { t, te } = useI18n()
const confirm = useConfirm()

function resolveText(value: string | undefined, fallbackKey: string): string {
  if (!value) return te(fallbackKey) ? t(fallbackKey) : fallbackKey
  return te(value) ? t(value) : value
}

function onClick(event: MouseEvent) {
  if (!props.showConfirm) {
    emit('click', event)
    return
  }

  confirm.require({
    header: resolveText(props.header, 'common.confirmHeader'),
    message: resolveText(props.message, 'common.confirmSaveMessage'),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: resolveText(props.acceptLabel, 'common.yes'),
    rejectLabel: resolveText(props.rejectLabel, 'common.no'),
    rejectProps: { severity: 'secondary', outlined: true },
    accept: () => emit('click', event),
  })
}
</script>

<template>
  <Button
    :label="label"
    :icon="icon"
    :loading="loading"
    :disabled="disabled"
    @click="onClick"
  />
</template>
