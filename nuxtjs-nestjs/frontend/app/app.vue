<script setup lang="ts">
const { t } = useI18n()

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ]
})

useSeoMeta({
  title: t('app.name'),
  description: 'A production-ready NuxtJS boilerplate'
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <PToast />
  <PConfirmDialog group="app-dialog">
    <template #message="{ message }">
      <div class="confirmdialog-custom">
        <div class="confirmdialog-header">
          <span
            v-if="message.icon"
            class="confirmdialog-icon-badge"
            :class="message.icon"
            :data-type="message.icon?.includes('check') ? 'success' : message.icon?.includes('info') ? 'info' : message.icon?.includes('times') ? 'error' : 'warning'"
          />
          <span class="confirmdialog-title">{{ message.header }}</span>
        </div>
        <p class="confirmdialog-message">{{ message.message }}</p>
      </div>
    </template>
  </PConfirmDialog>
</template>
