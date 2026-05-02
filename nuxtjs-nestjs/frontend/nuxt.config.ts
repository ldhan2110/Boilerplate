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
      apiBase: 'http://localhost:3000',
      maxFileSize: '10mb',
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
        button: { root: { style: 'font-size: 0.75rem; padding: 0.2rem 0.4rem' } },
        inputtext: { root: { style: 'font-size: 0.75rem; padding: 0.2rem 0.375rem' } },
        select: { root: { style: 'font-size: 0.75rem' } },
        multiselect: { root: { style: 'font-size: 0.75rem' } },
        textarea: { root: { style: 'font-size: 0.75rem; padding: 0.2rem 0.375rem' } },
        inputnumber: { root: { style: 'font-size: 0.75rem' } },
        datepicker: { root: { style: 'font-size: 0.75rem' } },
        datatable: { root: { style: 'font-size: 0.75rem' } },
        treetable: { root: { style: 'font-size: 0.75rem' } },
        card: { root: { style: 'font-size: 0.75rem' } },
        dialog: { root: { style: 'font-size: 0.75rem' } },
        tabs: { root: { style: 'font-size: 0.75rem' } },
        toolbar: { root: { style: 'font-size: 0.75rem; padding: 0.25rem 0.375rem' } },
        menu: { root: { style: 'font-size: 0.75rem' } },
        menubar: { root: { style: 'font-size: 0.75rem' } },
        breadcrumb: { root: { style: 'font-size: 0.75rem; padding: 0.2rem 0.375rem' } },
        checkbox: { root: { style: 'width: 1.125rem; height: 1.125rem' } },
        radiobutton: { root: { style: 'width: 1.125rem; height: 1.125rem' } },
        toggleswitch: { root: { style: 'width: 2.25rem; height: 1.25rem' } },
        tag: { root: { style: 'font-size: 0.625rem; padding: 0.1rem 0.3rem' } },
        badge: { root: { style: 'font-size: 0.625rem' } },
        message: { root: { style: 'font-size: 0.75rem' } },
        toast: { root: { style: 'font-size: 0.75rem' } },
        panel: { root: { style: 'font-size: 0.75rem' } },
        fieldset: { root: { style: 'font-size: 0.75rem' } },
        accordion: { root: { style: 'font-size: 0.75rem' } },
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
