import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const srcDirectory = fileURLToPath(new URL("./src", import.meta.url));
const serverOnlyStub = fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@": srcDirectory,
      "server-only": serverOnlyStub,
    },
  },
});
