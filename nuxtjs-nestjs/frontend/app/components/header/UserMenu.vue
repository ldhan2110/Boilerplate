<script setup lang="ts">
const { t } = useI18n()
const userStore = useUserStore()
const menu = ref()

const items = computed(() => [
  {
    label: t('header.profile'),
    icon: 'pi pi-user',
    command: () => {}
  },
  {
    label: t('header.settings'),
    icon: 'pi pi-cog',
    command: () => {}
  },
  {
    separator: true
  },
  {
    label: t('header.logout'),
    icon: 'pi pi-sign-out',
    command: () => userStore.logout()
  }
])

function toggle(event: Event) {
  menu.value.toggle(event)
}
</script>

<template>
  <PButton severity="secondary" text size="small" class="gap-2" @click="toggle">
    <PAvatar
      :label="userStore.displayName?.charAt(0)?.toUpperCase() || 'A'"
      shape="circle"
      style="width: 1.5rem; height: 1.5rem; font-size: 0.625rem;"
    />
    <span class="hidden md:inline text-sm font-medium">
      {{ userStore.displayName || 'Admin' }}
    </span>
  </PButton>
  <PMenu ref="menu" :model="items" :popup="true" appendTo="body" />
</template>
