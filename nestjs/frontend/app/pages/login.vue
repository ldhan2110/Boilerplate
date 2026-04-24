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
      <PCard>
        <!-- Logo + heading -->
        <template #header>
          <div class="text-center pt-6 px-6">
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
        </template>

        <template #content>
          <!-- Error message -->
          <div v-if="error" class="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {{ error }}
          </div>

          <!-- Form -->
          <form class="space-y-4" @submit.prevent="handleLogin">
            <div class="flex flex-col gap-2">
              <label for="login-email" class="text-sm font-medium">{{ t('login.email') }}</label>
              <PIconField>
                <PInputIcon class="pi pi-envelope" />
                <PInputText
                  id="login-email"
                  v-model="form.username"
                  type="text"
                  :placeholder="t('login.emailPlaceholder')"
                  class="w-full"
                  :disabled="loading"
                />
              </PIconField>
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between w-full">
                <label for="login-password" class="text-sm font-medium">{{ t('login.password') }}</label>
                <PButton
                  :label="t('login.forgotPassword')"
                  link
                  size="small"
                  class="p-0"
                />
              </div>
              <PPassword
                v-model="form.password"
                inputId="login-password"
                :placeholder="'••••••••'"
                :feedback="false"
                toggleMask
                class="w-full"
                inputClass="w-full"
                :disabled="loading"
              />
            </div>

            <div class="flex items-center gap-2">
              <PCheckbox inputId="remember-me" :binary="true" />
              <label for="remember-me" class="text-sm">{{ t('login.rememberMe') }}</label>
            </div>

            <PButton
              :label="loading ? t('login.signingIn') : t('login.signIn')"
              type="submit"
              class="w-full"
              :loading="loading"
              :disabled="loading || !form.username || !form.password"
            />
          </form>

          <!-- Language switcher -->
          <div class="mt-6 flex justify-center">
            <HeaderLanguageSwitcher />
          </div>
        </template>
      </PCard>
    </div>
  </div>
</template>
