import Aura from '@primeuix/themes/aura'
import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@primevue/nuxt-module',
    '@pinia/nuxt',
    '@nuxtjs/i18n'
  ],

  devtools: {
    enabled: true
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['quill', 'quill-delta']
    }
  },

  css: ['~/assets/css/main.css', 'primeicons/primeicons.css'],

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3000'
    }
  },

  components: [
    {
      path: '~/components/common',
      pathPrefix: false, // ✅ no prefix here
    },
    {
      path: '~/components',
      pathPrefix: true, // default behavior for everything else
    }
  ],

  primevue: {
    autoImport: true,
    components: {
      prefix: 'P'
    },
    composables: {
      exclude: ['useToast', 'useConfirm']
    },
    options: {
      ripple: true,
      inputVariant: 'filled',
      pt: {
        button: { root: { style: 'font-size: 0.8125rem; padding: 0.375rem 0.625rem' } },
        inputtext: { root: { style: 'font-size: 0.8125rem; padding: 0.375rem 0.625rem' } },
        select: { root: { style: 'font-size: 0.8125rem' } },
        textarea: { root: { style: 'font-size: 0.8125rem; padding: 0.375rem 0.625rem' } },
        datatable: { root: { style: 'font-size: 0.8125rem' } },
        card: { root: { style: 'font-size: 0.8125rem' } },
        dialog: { root: { style: 'font-size: 0.8125rem' } },
        checkbox: { root: { style: 'width: 1.25rem; height: 1.25rem' } },
        radiobutton: { root: { style: 'width: 1.25rem; height: 1.25rem' } },
        tag: { root: { style: 'font-size: 0.6875rem; padding: 0.1875rem 0.375rem' } },
        badge: { root: { style: 'font-size: 0.6875rem' } }
      },
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark'
        }
      }
    }
  },

  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'vi', name: 'Tiếng Việt', file: 'vi.json' }
    ],
    defaultLocale: 'en',
    strategy: 'no_prefix',
    langDir: 'locales'
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
