import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
      },
    },
  },
  {
    rules: {
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  prettier,
  {
    ignores: [".vitepress/dist/**", ".vitepress/cache/**", "node_modules/**"],
  },
];
