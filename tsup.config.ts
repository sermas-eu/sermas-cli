import { defineConfig } from "tsup";

// One output file per source file: commands are found at run time by globbing
// dist/commands. @sermas/api-client is bundled from its sources into shared
// chunks, so the built CLI needs no published client.
export default defineConfig({
  entry: ["src/**/*.ts", "!src/**/*.spec.ts", "!src/tpl/**"],
  format: ["esm"],
  target: "node24",
  platform: "node",
  splitting: true,
  sourcemap: true,
  clean: true,
  dts: false,
  noExternal: ["@sermas/api-client"],
});
