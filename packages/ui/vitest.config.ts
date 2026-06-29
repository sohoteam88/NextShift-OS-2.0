import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@nextshift/shared": fileURLToPath(
        new URL("../shared/src/index.ts", import.meta.url)
      ),
      "@nextshift/ui": fileURLToPath(new URL("src/index.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.tsx"],
  },
});
