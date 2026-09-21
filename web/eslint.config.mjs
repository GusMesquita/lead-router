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
    // Componentes vindos de registries (shadcn e afins) são código de terceiro
    // versionado aqui. Lintá-los só produz ruído que some no próximo `add`.
    "components/ui/**",
    "components/bjork-ui/**",
    "components/beste/**",
  ]),
]);

export default eslintConfig;
