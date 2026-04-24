<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()

const breadcrumbHome = { icon: 'pi pi-home', to: '/' }

const breadcrumbItems = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  return segments.map((segment, index) => {
    const to = '/' + segments.slice(0, index + 1).join('/')
    const key = `sidebar.${segment}`
    return {
      label: t(key, segment.charAt(0).toUpperCase() + segment.slice(1)),
      to
    }
  })
})
</script>

<template>
  <PBreadcrumb :home="breadcrumbHome" :model="breadcrumbItems" />
</template>
