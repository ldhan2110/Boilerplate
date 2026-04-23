<script setup lang="ts">
definePageMeta({
  layout: false
})

const { t } = useI18n()
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
    <div class="w-full max-w-sm">
      <UCard class="shadow-lg">
        <!-- Logo + heading -->
        <div class="text-center mb-6">
          <div class="flex justify-center mb-4">
            <AppLogo />
          </div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ t('login.welcome') }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ t('login.subtitle') }}
          </p>
        </div>

        <!-- Form -->
        <form @submit.prevent class="space-y-4">
          <UFormField :label="t('login.email')">
            <UInput
              type="email"
              :placeholder="t('login.emailPlaceholder')"
              icon="i-lucide-mail"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField>
            <template #label>
              <div class="flex items-center justify-between w-full">
                <span>{{ t('login.password') }}</span>
                <UButton
                  :label="t('login.forgotPassword')"
                  variant="link"
                  size="xs"
                  :padded="false"
                />
              </div>
            </template>
            <UInput
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <div class="flex items-center gap-2">
            <UCheckbox :label="t('login.rememberMe')" />
          </div>

          <UButton
            :label="t('login.signIn')"
            type="submit"
            block
            size="lg"
          />
        </form>

        <!-- Language switcher -->
        <div class="mt-6 flex justify-center">
          <HeaderLanguageSwitcher />
        </div>
      </UCard>
    </div>
  </div>
</template>
