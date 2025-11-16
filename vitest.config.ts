/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: "./src/lib/vitest/setup.ts",
    css: true,
    exclude: ["./tests/**", "**/node_modules/**"],
  },
});
