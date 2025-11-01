// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',      
      'scripts/*.js',
      'commitlint.config.js'
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    files: ["src/**/*.{ts,js}", "db/**/*.{ts,js}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn'
    },
  },

  {
    files: ["testing/**/*.{ts,js}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',         // allow type 'any'
      '@typescript-eslint/no-unsafe-assignment': 'off',    // allow assigning values of type 'any'
      '@typescript-eslint/no-unsafe-member-access': 'off', // allow property access on 'any'
      '@typescript-eslint/no-unsafe-return': 'off',        // allow returning 'any'
      '@typescript-eslint/no-unsafe-call': 'off',          // allow calling 'any' as a function
      '@typescript-eslint/no-unsafe-argument': 'off',      // allow passing 'any' as args
      '@typescript-eslint/no-require-imports': 'off',      // allow require() imports 
    },
  },
  {
    files: ["testing/integration/**/*.{ts,js}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@unit/*", "@e2e/*", "@components/*"],
              message: "Imports from another tests folder are not allowed",
            },
            {
              group: ["testing/*"],
              message: "Use aliases instead of relative imports",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["testing/unit/**/*.{ts,js}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@integration/*", "@e2e/*","@components/*"],
              message: "Imports from another tests folder are not allowed",
            },
            {
              group: ["testing/*"],
              message: "Use aliases instead of relative imports",
            },
          ],
        },
      ],
      "no-restricted-properties": [
        "error",
        {
          property: 'toContainCookie',
          message: 'Integration-only matcher.',
        },
        {
          property: 'emailSentToThisAddress',
          message: 'Integration-only matcher.',
        },
      ],
    },
  },
  {
    files: ["testing/components/**/*.{ts,js}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@integration/*", "@e2e/*", "@unit/*"],
              message: "Imports from another tests folder are not allowed",
            },
            {
              group: ["testing/*"],
              message: "Use aliases instead of relative imports",
            },
          ],
        },
      ],
      "no-restricted-properties": [
        "error",
        {                    
          property: 'toContainCookie',
          message: 'Integration-only matcher.',
        },
        {
          property: 'emailSentToThisAddress',
          message: 'Integration-only matcher.',
        },
      ],
    },
  },
);