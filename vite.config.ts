import { defineConfig } from "vitest/config";

// Project pages are served from https://<user>.github.io/<repo>/, so the build
// needs that repo path as its base; the dev server stays at root.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/sheet-reading/" : "/",
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
}));
