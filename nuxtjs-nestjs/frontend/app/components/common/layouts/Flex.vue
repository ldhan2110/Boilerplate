<script lang="ts" setup>
type Direction = 'row' | 'col' | 'row-reverse' | 'col-reverse'
type Wrap = 'wrap' | 'nowrap' | 'wrap-reverse'
type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'

interface ResponsiveOverrides {
  direction?: Direction
  align?: Align
  justify?: Justify
  gap?: string
  gapX?: string
  gapY?: string
  wrap?: Wrap
}

interface FlexProps {
  as?: string
  direction?: Direction
  wrap?: Wrap
  align?: Align
  justify?: Justify
  gap?: string
  gapX?: string
  gapY?: string
  minChildWidth?: string
  fullWidth?: boolean
  fullHeight?: boolean
  container?: boolean
  responsive?: {
    sm?: ResponsiveOverrides
    md?: ResponsiveOverrides
    lg?: ResponsiveOverrides
    xl?: ResponsiveOverrides
  }
}

const props = withDefaults(defineProps<FlexProps>(), {
  as: 'div',
  direction: 'row',
  wrap: 'nowrap',
  align: 'stretch',
  justify: 'start',
})

const directionMap: Record<Direction, string> = {
  'row': 'flex-row',
  'col': 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'col-reverse': 'flex-col-reverse',
}

const wrapMap: Record<Wrap, string> = {
  'wrap': 'flex-wrap',
  'nowrap': 'flex-nowrap',
  'wrap-reverse': 'flex-wrap-reverse',
}

const alignMap: Record<Align, string> = {
  'start': 'items-start',
  'center': 'items-center',
  'end': 'items-end',
  'stretch': 'items-stretch',
  'baseline': 'items-baseline',
}

const justifyMap: Record<Justify, string> = {
  'start': 'justify-start',
  'center': 'justify-center',
  'end': 'justify-end',
  'between': 'justify-between',
  'around': 'justify-around',
  'evenly': 'justify-evenly',
}

function gapClass(prefix: string, value: string | undefined): string {
  if (!value) return ''
  return `${prefix}${value}`
}

function responsiveClasses(breakpoint: string, overrides: ResponsiveOverrides | undefined): string[] {
  if (!overrides) return []
  const classes: string[] = []
  if (overrides.direction) classes.push(`${breakpoint}:${directionMap[overrides.direction]}`)
  if (overrides.wrap) classes.push(`${breakpoint}:${wrapMap[overrides.wrap]}`)
  if (overrides.align) classes.push(`${breakpoint}:${alignMap[overrides.align]}`)
  if (overrides.justify) classes.push(`${breakpoint}:${justifyMap[overrides.justify]}`)
  if (overrides.gap) classes.push(`${breakpoint}:gap-${overrides.gap}`)
  if (overrides.gapX) classes.push(`${breakpoint}:gap-x-${overrides.gapX}`)
  if (overrides.gapY) classes.push(`${breakpoint}:gap-y-${overrides.gapY}`)
  return classes
}

const classes = computed(() => {
  const c: string[] = ['flex']

  c.push(directionMap[props.direction])
  c.push(props.minChildWidth ? 'flex-wrap' : wrapMap[props.wrap])
  c.push(alignMap[props.align])
  c.push(justifyMap[props.justify])

  const g = gapClass('gap-', props.gap)
  if (g) c.push(g)
  const gx = gapClass('gap-x-', props.gapX)
  if (gx) c.push(gx)
  const gy = gapClass('gap-y-', props.gapY)
  if (gy) c.push(gy)

  if (props.fullWidth) c.push('w-full')
  if (props.fullHeight) c.push('h-full')
  if (props.container) c.push('@container')

  if (props.responsive) {
    for (const bp of ['sm', 'md', 'lg', 'xl'] as const) {
      c.push(...responsiveClasses(bp, props.responsive[bp]))
    }
  }

  return c.join(' ')
})

const style = computed(() => {
  if (!props.minChildWidth) return undefined
  return { '--flex-min-child': props.minChildWidth } as Record<string, string>
})
</script>

<template>
  <component :is="as" :class="classes" :style="style">
    <slot />
  </component>
</template>

<style scoped>
[style*='--flex-min-child'] > :deep(*) {
  flex: 1 1 var(--flex-min-child);
}
</style>
