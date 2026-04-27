<script lang="ts" setup>
type Align = 'start' | 'center' | 'end' | 'stretch'
type Justify = 'start' | 'center' | 'end' | 'stretch'

type ResponsiveCols = {
  base?: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
}

interface GridProps {
  as?: string
  minChildWidth?: string
  cols?: number | ResponsiveCols
  rows?: number
  gap?: string
  gapX?: string
  gapY?: string
  align?: Align
  justify?: Justify
  fullWidth?: boolean
  container?: boolean
}

const props = withDefaults(defineProps<GridProps>(), {
  as: 'div',
  align: 'stretch',
  justify: 'stretch',
})

const alignMap: Record<Align, string> = {
  'start': 'items-start',
  'center': 'items-center',
  'end': 'items-end',
  'stretch': 'items-stretch',
}

const justifyMap: Record<Justify, string> = {
  'start': 'justify-items-start',
  'center': 'justify-items-center',
  'end': 'justify-items-end',
  'stretch': 'justify-items-stretch',
}

const useAutoFill = computed(() => {
  return !!props.minChildWidth && !props.cols
})

const classes = computed(() => {
  const c: string[] = ['grid']

  // Column classes (only when not using auto-fill)
  if (!useAutoFill.value) {
    if (typeof props.cols === 'number') {
      c.push(`grid-cols-${props.cols}`)
    } else if (typeof props.cols === 'object') {
      if (props.cols.base) c.push(`grid-cols-${props.cols.base}`)
      if (props.cols.sm) c.push(`sm:grid-cols-${props.cols.sm}`)
      if (props.cols.md) c.push(`md:grid-cols-${props.cols.md}`)
      if (props.cols.lg) c.push(`lg:grid-cols-${props.cols.lg}`)
      if (props.cols.xl) c.push(`xl:grid-cols-${props.cols.xl}`)
    }
  }

  if (props.rows) c.push(`grid-rows-${props.rows}`)

  if (props.gap) c.push(`gap-${props.gap}`)
  if (props.gapX) c.push(`gap-x-${props.gapX}`)
  if (props.gapY) c.push(`gap-y-${props.gapY}`)

  c.push(alignMap[props.align])
  c.push(justifyMap[props.justify])

  if (props.fullWidth) c.push('w-full')
  if (props.container) c.push('@container')

  return c.join(' ')
})

const style = computed(() => {
  if (!useAutoFill.value) return undefined
  return {
    'grid-template-columns': `repeat(auto-fill, minmax(${props.minChildWidth}, 1fr))`,
  }
})
</script>

<template>
  <component :is="as" :class="classes" :style="style">
    <slot />
  </component>
</template>
