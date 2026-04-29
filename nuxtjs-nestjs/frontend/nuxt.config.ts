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

  ssr: false,

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
        /* ── Slightly compact enterprise sizing ── */
        button: { root: { style: 'font-size: 0.8125rem; padding: 0.3rem 0.5rem' } },
        inputtext: { root: { style: 'font-size: 0.8125rem; padding: 0.3rem 0.5rem' } },
        select: { root: { style: 'font-size: 0.8125rem' } },
        multiselect: { root: { style: 'font-size: 0.8125rem' } },
        textarea: { root: { style: 'font-size: 0.8125rem; padding: 0.3rem 0.5rem' } },
        inputnumber: { root: { style: 'font-size: 0.8125rem' } },
        datepicker: { root: { style: 'font-size: 0.8125rem' } },
        datatable: { root: { style: 'font-size: 0.8125rem' } },
        card: { root: { style: 'font-size: 0.8125rem' } },
        dialog: { root: { style: 'font-size: 0.8125rem' } },
        tabs: { root: { style: 'font-size: 0.8125rem' } },
        toolbar: { root: { style: 'font-size: 0.8125rem; padding: 0.375rem 0.5rem' } },
        menu: { root: { style: 'font-size: 0.8125rem' } },
        menubar: { root: { style: 'font-size: 0.8125rem' } },
        breadcrumb: { root: { style: 'font-size: 0.8125rem; padding: 0.3rem 0.5rem' } },
        checkbox: { root: { style: 'width: 1.125rem; height: 1.125rem' } },
        radiobutton: { root: { style: 'width: 1.125rem; height: 1.125rem' } },
        tag: { root: { style: 'font-size: 0.6875rem; padding: 0.15rem 0.35rem' } },
        badge: { root: { style: 'font-size: 0.6875rem' } },
        message: { root: { style: 'font-size: 0.8125rem' } },
        toast: { root: { style: 'font-size: 0.8125rem' } },
        panel: { root: { style: 'font-size: 0.8125rem' } },
        fieldset: { root: { style: 'font-size: 0.8125rem' } },
        accordion: { root: { style: 'font-size: 0.8125rem' } },
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
