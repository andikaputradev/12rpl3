import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules", ".next", "e2e", "**/*.config.*"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "."),
      "server-only": path.resolve(dirname, "./vitest.empty-module.ts"),
    },
  },
});
