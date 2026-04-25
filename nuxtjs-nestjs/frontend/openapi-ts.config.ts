import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: `${process.env.NUXT_PUBLIC_API_URL}-docs`,
  output: {
    format: 'prettier',
    lint: 'eslint',
    path: './app/types/api',
  },
  plugins: [
    {
      enums: 'typescript',
      name: '@hey-api/typescript',
    },
  ],
});