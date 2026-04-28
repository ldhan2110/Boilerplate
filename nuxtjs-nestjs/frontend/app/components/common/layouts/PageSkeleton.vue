<script setup lang="ts">
const route = useRoute()

// Seeded PRNG from route path — deterministic per route
function seedRandom(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  let state = hash
  return () => {
    state = (state * 1664525 + 1013904223) | 0
    return ((state >>> 0) / 4294967296)
  }
}

function randBetween(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min
}

const rng = seedRandom(route.path)

// Heading
const headingWidth = `${randBetween(rng, 35, 50)}%`
const subtitleWidth = `${randBetween(rng, 20, 30)}%`

// Cards
const cardCount = randBetween(rng, 5, 8)
const cards = Array.from({ length: cardCount }, () => {
  const lineCount = randBetween(rng, 3, 6)
  const lines = Array.from({ length: lineCount }, (_, i) => ({
    width: `${randBetween(rng, i === 0 ? 55 : 40, i === 0 ? 95 : 85)}%`,
    height: i === 0 ? '1.25rem' : '0.875rem'
  }))
  return { lines }
})
</script>

<template>
  <div class="animate-pulse min-h-full">
    <!-- Heading skeleton -->
    <div class="mb-6">
      <PSkeleton
        :style="{ width: headingWidth }"
        height="2rem"
        border-radius="0.375rem"
      />
      <PSkeleton
        :style="{ width: subtitleWidth }"
        height="1rem"
        border-radius="0.25rem"
        class="mt-2"
      />
    </div>

    <!-- Card skeletons -->
    <div class="flex flex-col gap-4">
      <div
        v-for="(card, ci) in cards"
        :key="ci"
        class="rounded-lg bg-surface-0 dark:bg-surface-900 p-5"
      >
        <div class="flex flex-col gap-3">
          <PSkeleton
            v-for="(line, li) in card.lines"
            :key="li"
            :style="{ width: line.width }"
            :height="line.height"
            border-radius="0.25rem"
          />
        </div>
      </div>
    </div>
  </div>
</template>
