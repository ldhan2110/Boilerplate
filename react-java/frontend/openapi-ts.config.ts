import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: process.env.VITE_API_URL + '-docs',
  output: {
    format: 'prettier',
    lint: 'eslint',
    path: './src/types/api',
  },
  plugins: [
    {
      enums: 'typescript',
      name: '@hey-api/typescript',
    },
  ],
});