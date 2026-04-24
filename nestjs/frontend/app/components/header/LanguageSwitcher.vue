<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
const userStore = useUserStore()
const menu = ref()

const currentLocale = computed(() =>
  (locales.value as any[]).find((l: any) => l.code === locale.value)
)

const localeItems = computed(() =>
  (locales.value as any[]).map(l => ({
    label: l.name,
    command: () => {
      setLocale(l.code)
      userStore.updatePreference('locale', l.code)
    }
  }))
)

function toggle(event: Event) {
  menu.value.toggle(event)
}
</script>

<template>
  <div>
    <PButton
      severity="secondary"
      text
      rounded
      size="small"
      :label="currentLocale?.code?.toUpperCase()"
      icon="pi pi-globe"
      @click="toggle"
    />
    <PMenu ref="menu" :model="localeItems" :popup="true" appendTo="body" />
  </div>
</template>
