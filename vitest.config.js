import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["**/*.test.tsx"],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/.storybook/**",
            "**/e2e/**",
          ],
          setupFiles: ["./vitest.setup.ts"],
          alias: { "@": path.resolve(dirname, ".") },
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          fileParallelism: false,
          include: ["**/*.test.ts"],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/.storybook/**",
            "**/e2e/**",
          ],
          env: {
            DATABASE_URL:
              "postgresql://postgres:postgres@127.0.0.1:54322/postgres_test",
          },
          globalSetup: ["./vitest.global-setup.ts"],
          alias: { "@": path.resolve(dirname, ".") },
        },
      },
    ],
  },
});
