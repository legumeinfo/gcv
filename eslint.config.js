// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("@angular-eslint/eslint-plugin");
const angularTemplate = require("@angular-eslint/eslint-plugin-template");
const angularTemplateParser = require("@angular-eslint/template-parser");
const ngrx = require("@ngrx/eslint-plugin");

module.exports = [
  {
    ignores: ["projects/**/*", "dist/**/*", "node_modules/**/*"],
  },
  // TypeScript files
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "@angular-eslint": angular,
      "@ngrx": ngrx,
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...tseslint.configs.recommended.reduce((acc, config) => {
        return { ...acc, ...config.rules };
      }, {}),
      ...angular.configs.recommended.rules,
      ...ngrx.configs.all.rules,
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
    },
  },
  // HTML template files
  {
    files: ["**/*.html"],
    plugins: {
      "@angular-eslint/template": angularTemplate,
    },
    languageOptions: {
      parser: angularTemplateParser,
    },
    rules: {
      ...angularTemplate.configs.recommended.rules,
    },
  },
];
