<script setup lang="ts">
definePageMeta({
  layout: false
})

const { t } = useI18n()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: ''
})
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const success = await userStore.login(form.username, form.password)
    if (success) {
      await navigateTo('/')
    } else {
      error.value = t('login.invalidCredentials')
    }
  } catch {
    error.value = t('login.loginError')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
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

        <!-- Error message -->
        <div v-if="error" class="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {{ error }}
        </div>

        <!-- Form -->
        <form class="space-y-4" @submit.prevent="handleLogin">
          <UFormField :label="t('login.email')">
            <UInput
              v-model="form.username"
              type="text"
              :placeholder="t('login.emailPlaceholder')"
              icon="i-lucide-mail"
              size="lg"
              class="w-full"
              :disabled="loading"
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
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              size="lg"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <div class="flex items-center gap-2">
            <UCheckbox :label="t('login.rememberMe')" />
          </div>

          <UButton
            :label="loading ? t('login.signingIn') : t('login.signIn')"
            type="submit"
            block
            size="lg"
            :loading="loading"
            :disabled="loading || !form.username || !form.password"
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
