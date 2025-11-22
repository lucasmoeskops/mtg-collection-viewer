import nextTypescript from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import stylistic from "@stylistic/eslint-plugin";

const eslintConfig = defineConfig([
  ...nextTypescript,
  ...nextVitals,
  {
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "sort-imports": [
        "warn",
        {
          ignoreDeclarationSort: true,
        },
      ],
      "@stylistic/indent": ["error", 2],
      "@stylistic/max-len": ["error", { code: 140 }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
]);
export default eslintConfig;
