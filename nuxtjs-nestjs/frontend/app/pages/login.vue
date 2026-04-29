<script setup lang="ts">
import { z } from 'zod'

definePageMeta({
  layout: false
})

const { t } = useI18n()
const userStore = useUserStore()

const loginFormSchema = z.object({
  tenantId: z.string().min(1, { message: t('login.tenantIdRequired') }),
  username: z.string().min(1, { message: t('login.usernameRequired') }),
  password: z.string().min(1, { message: t('login.passwordTooShort') })
})

const { formProps, formRef, field , values, isSubmitting } = useAppForm<typeof loginFormSchema>({
  schema: loginFormSchema,
  initialValues: {
    tenantId: '',
    username: '',
    password: ''
  },
  onSubmit: async (values) => {
    userStore.login(values)
      .then(() => {
        navigateTo('/')
      })
      .catch((err) => {
        error.value = err.message || t('login.loginFailed')
      })
  },
  guard: false
})

const error = ref('')

</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
    <div class="w-full max-w-sm">
      <PCard>
        <!-- Logo + heading -->
        <template #header>
          <div class="text-center pt-6 px-6">
            <div class="flex justify-center mb-4">
              <div class="flex items-center justify-center w-20 h-20 rounded-xl bg-primary">
                <i class="pi pi-prime text-5xl"></i>
              </div>
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
            <PForm ref="formRef" v-bind="formProps"  v-slot="$form">
              <Flex direction="col" gap="4" class="p-4">
                <div class="flex flex-col">
                  <Input
                      v-bind="field('tenantId')"
                      :label="t('login.tenantId')"
                      prefix-icon="pi pi-building"
                      required
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <Input
                      v-bind="field('username')"
                      :label="t('login.username')"
                      prefix-icon="pi pi-envelope"
                      required
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <Input
                      v-bind="field('password')"
                      :label="t('login.password')"
                      type="password"
                      prefix-icon="pi pi-envelope"
                      required
                  />
                </div>

                <div class="flex items-center gap-2">
                  <PCheckbox inputId="remember-me" :binary="true" />
                  <label for="remember-me" class="text-sm">{{ t('login.rememberMe') }}</label>
                </div>

                <PButton
                  :label="isSubmitting ? t('login.signingIn') : t('login.signIn')"
                  type="submit"
                  class="w-full"
                  :loading="isSubmitting"
                  :disabled="isSubmitting || !values.username || !values.password || !values.tenantId"
                />
              </Flex>
            </PForm>

          <!-- Language switcher -->
          <div class="mt-6 flex justify-center">
            <HeaderLanguageSwitcher />
          </div>
        </template>
      </PCard>
    </div>
  </div>
</template>
