import { defineConfig } from '@hey-api/openapi-ts';
import { config } from 'dotenv';

config();

export default defineConfig({
  input: `${process.env.NUXT_PUBLIC_API_BASE}/api-json`,
  output: {
    path: './app/types/api',
  },
  plugins: [
    {
      enums: 'typescript',
      name: '@hey-api/typescript',
    },
  ],
  postProcess: ['eslint', 'prettier'],
});