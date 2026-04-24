<script setup lang="ts">
const { t } = useI18n()
const userStore = useUserStore()
const op = ref()

const colors: { value: 'green' | 'blue' | 'purple' | 'orange'; bg: string }[] = [
  { value: 'green', bg: 'bg-green-500' },
  { value: 'blue', bg: 'bg-blue-500' },
  { value: 'purple', bg: 'bg-purple-500' },
  { value: 'orange', bg: 'bg-orange-500' }
]

function toggle(event: Event) {
  op.value.toggle(event)
}
</script>

<template>
  <PButton
    severity="secondary"
    text
    rounded
    size="small"
    icon="pi pi-palette"
    :title="t('theme.accentColor')"
    @click="toggle"
  />

  <PPopover ref="op" appendTo="body">
    <div class="p-3">
      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
        {{ t('theme.accentColor') }}
      </p>
      <div class="flex gap-2">
        <button
          v-for="color in colors"
          :key="color.value"
          class="size-7 rounded-full transition-all"
          :class="[
            color.bg,
            userStore.preferences.accentColor === color.value
              ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-gray-400'
              : 'hover:scale-110'
          ]"
          :title="t(`theme.${color.value}`)"
          @click="userStore.updatePreference('accentColor', color.value)"
        />
      </div>
    </div>
  </PPopover>
</template>
