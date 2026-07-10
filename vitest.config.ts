import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@nextshift/shared': fileURLToPath(new URL('./packages/shared/src/index.ts', import.meta.url)),
      '@nextshift/contracts': fileURLToPath(new URL('./packages/contracts/src/index.ts', import.meta.url)),
      '@nextshift/runtime': fileURLToPath(new URL('./packages/runtime/src/index.ts', import.meta.url)),
      '@nextshift/decision-brain': fileURLToPath(new URL('./packages/decision-brain/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
    ],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
