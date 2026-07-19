import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig({
  files: ["autocomplete.ts"],
  extends: [
    js.configs.recommended,
    tseslint.configs.recommended
  ],
  rules: {
    "@typescript-eslint/no-unused-expressions": ["error", {
      allowShortCircuit: true,
      allowTernary: true
    }],
    "@typescript-eslint/no-unused-vars": ["error", {
      argsIgnorePattern: "^_"
    }],
    curly: ["error", "multi-line"],
    eqeqeq: ["error", "always", {
      null: "ignore"
    }],
    "no-eval": "error",
    "no-var": "off",
    radix: "error"
  }
});
