// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const ngrx = require("@ngrx/eslint-plugin");
const unusedImports = require("eslint-plugin-unused-imports");

module.exports = tseslint.config(
  {
    ignores: ["projects/**/*", "dist/**/*", "node_modules/**/*"],
  },
  // TypeScript files
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      "@ngrx": ngrx,
      "unused-imports": unusedImports,
    },
    processor: angular.processInlineTemplates,
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    rules: {
      ...ngrx.configs.all.rules,
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "gcv",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "gcv",
          style: "kebab-case",
        },
      ],
      // Deferred migrations (tracked separately): GCV is intentionally
      // NgModule-based, and ng update added ChangeDetectionStrategy.Eager to
      // preserve behavior on the Angular 22 upgrade. Revisit as their own work.
      "@angular-eslint/prefer-standalone": "off",
      "@angular-eslint/prefer-on-push-component-change-detection": "off",
      // Large legacy D3/visualization surface; tracked as incremental typing
      // work rather than a merge blocker.
      "@typescript-eslint/no-explicit-any": "warn",
      // GCV names injected privates with a leading underscore (_appConfig,
      // _activatedRoute, …); keep the global store consistent with that rather
      // than renaming every service to the rule's default of `store`.
      "@ngrx/use-consistent-global-store-name": ["error", "_store"],
      // Unused imports are auto-removable; delegate them (and unused vars) to
      // eslint-plugin-unused-imports so `--fix` prunes dead imports on its own.
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          // Flag genuinely dead local variables, but not unused positional
          // callback args or catch bindings — both are routinely required by
          // the signature (D3 accessors, rxjs/effect callbacks) and can't be
          // dropped without breaking it.
          vars: "all",
          varsIgnorePattern: "^_",
          args: "none",
          caughtErrors: "none",
        },
      ],
    },
  },
  // HTML template files
  {
    files: ["**/*.html"],
    extends: [...angular.configs.templateRecommended],
    rules: {},
  },
);
