import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: [
      'src/__tests__/{isolation,security,mission-engine,services,api}/**/*.test.ts',
      'src/lib/observability/__tests__/**/*.test.ts',
      'src/modules/agent-runtime/telemetry/__tests__/**/*.test.ts',
    ],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
