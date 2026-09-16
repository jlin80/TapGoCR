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
    // Punto de entrada CommonJS para Phusion Passenger (cPanel): no es
    // código de la app, así que no aplican las reglas de import de ESM/TS.
    "server.js",
  ]),
]);

export default eslintConfig;
