import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // eslint-plugin-react-hooks v6 ships `set-state-in-effect` as an error.
      // It flags intentional client-only patterns we rely on — the live JST
      // clock and the `mounted` guard that prevents next-themes hydration
      // mismatches — and also trips shadcn's own generated `use-mobile` hook.
      // These are one-shot / interval updates that don't cause cascading
      // renders, so we disable the rule rather than contort the code.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
