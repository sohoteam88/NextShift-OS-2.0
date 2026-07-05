import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@nextshift/event-bus": fileURLToPath(
        new URL("../event-bus/src/index.ts", import.meta.url)
      ),
      "@nextshift/runtime-core": fileURLToPath(
        new URL("../runtime-core/src/index.ts", import.meta.url)
      ),
      "@nextshift/runtime-orchestrator": fileURLToPath(
        new URL("src/index.ts", import.meta.url)
      ),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
