import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/lib/vitest/setup.ts",
    css: true,
    exclude: ["./tests/**", "**/node_modules/**"],
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
