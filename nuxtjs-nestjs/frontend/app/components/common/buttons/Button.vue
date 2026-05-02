<script lang="ts" setup>
type Variant = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast'
type Size = 'xs' | 'sm' | 'md' | 'lg'
type IconPos = 'left' | 'right' | 'top' | 'bottom'

interface ButtonProps {
  /** Button text — pass an i18n key to auto-translate, or raw text */
  label?: string
  /** PrimeIcons class, e.g. "pi pi-check" */
  icon?: string
  /** Icon position relative to label */
  iconPos?: IconPos
  /** Color variant (maps to PrimeVue severity) */
  variant?: Variant
  /** Size preset */
  size?: Size
  /** Render as text-only (no background) */
  text?: boolean
  /** Render with outline border */
  outlined?: boolean
  /** Render as a link */
  link?: boolean
  /** Add raised shadow */
  raised?: boolean
  /** Pill-shaped corners */
  rounded?: boolean
  /** Stretch to full container width */
  block?: boolean
  /** Show spinner and disable interaction */
  loading?: boolean
  /** Disable the button */
  disabled?: boolean
  /** Icon-only mode (no label rendered, adds aria-label) */
  iconOnly?: boolean
  /** Badge text */
  badge?: string
  /** Badge severity */
  badgeSeverity?: 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast'
  /** Native button type */
  type?: 'button' | 'submit' | 'reset'
  /** Accessible label for icon-only buttons */
  ariaLabel?: string
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'sm',
  iconPos: 'left',
  type: 'button',
  text: false,
  outlined: false,
  link: false,
  raised: false,
  rounded: false,
  block: false,
  loading: false,
  disabled: false,
  iconOnly: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const { t, te } = useI18n()

/** Translate label if it looks like an i18n key */
const resolvedLabel = computed(() => {
  if (!props.label) return undefined
  return te(props.label) ? t(props.label) : props.label
})

/** Map custom size to PrimeVue size */
const pvSize = computed(() => {
  const map: Record<Size, string | undefined> = {
    xs: 'small',
    sm: 'small',
    md: undefined, // PrimeVue default
    lg: 'large',
  }
  return map[props.size]
})

/** Extra classes for sizes PrimeVue doesn't natively support + block */
const sizeClass = computed(() => {
  const classes: string[] = []
  if (props.size === 'xs') classes.push('btn-xs')
  if (props.block) classes.push('w-full')
  return classes.join(' ')
})
</script>

<template>
  <PButton
    :label="iconOnly ? undefined : resolvedLabel"
    :icon="icon"
    :icon-pos="iconPos"
    :severity="variant === 'primary' ? undefined : variant"
    :size="pvSize"
    :text="text"
    :outlined="outlined"
    :link="link"
    :raised="raised"
    :rounded="rounded || iconOnly"
    :loading="loading"
    :disabled="disabled || loading"
    :badge="badge"
    :badge-severity="badgeSeverity"
    :type="type"
    :aria-label="ariaLabel || (iconOnly ? resolvedLabel : undefined)"
    :class="sizeClass"
    @click="emit('click', $event)"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.icon" #icon>
      <slot name="icon" />
    </template>
  </PButton>
</template>

<style scoped>
/* Extra-small size that PrimeVue doesn't provide */
:deep(.btn-xs) {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
:deep(.btn-xs .p-button-icon) {
  font-size: 0.75rem;
}
</style>
