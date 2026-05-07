import path from 'path';
import { fileURLToPath } from 'url';

import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendProject = path.join(__dirname, 'apps/frontend/tsconfig.app.json');
const backendProject = path.join(__dirname, 'apps/backend/tsconfig.json');
const schemasProject = path.join(__dirname, 'packages/schemas/tsconfig.json');

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      'apps/frontend/src/app/routeTree.gen.ts',
    ],
  },
  {
    files: ['apps/frontend/src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    settings: {
      'import/resolver': {
        typescript: {
          project: frontendProject,
        },
      },
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'import/no-duplicates': 'off',
      'import/no-named-as-default': 'off',
      'react-refresh/only-export-components': [
        'off',
        { allowConstantExport: true },
      ],
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'no-case-declarations': 'off',
      'no-fallthrough': 'off',
      'prefer-const': 'off',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: 'apps/frontend/src/shared',
              from: [
                'apps/frontend/src/entities',
                'apps/frontend/src/features',
                'apps/frontend/src/widgets',
                'apps/frontend/src/pages',
                'apps/frontend/src/app',
              ],
            },
            {
              target: 'apps/frontend/src/entities',
              from: [
                'apps/frontend/src/features',
                'apps/frontend/src/widgets',
                'apps/frontend/src/pages',
                'apps/frontend/src/app',
              ],
            },
            {
              target: 'apps/frontend/src/features',
              from: [
                'apps/frontend/src/widgets',
                'apps/frontend/src/pages',
                'apps/frontend/src/app',
              ],
            },
            {
              target: 'apps/frontend/src/widgets',
              from: ['apps/frontend/src/pages', 'apps/frontend/src/app'],
            },
            {
              target: 'apps/frontend/src/pages',
              from: ['apps/frontend/src/app'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/backend/src/**/*.ts', 'packages/schemas/**/*.ts'],
    extends: [
      js.configs.recommended,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    settings: {
      'import/resolver': {
        typescript: {
          project: [backendProject, schemasProject],
        },
      },
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/require-await': 'off',
      'import/no-duplicates': 'off',
      'import/no-named-as-default': 'off',
      'no-console': 'off',
      'no-case-declarations': 'off',
      'no-fallthrough': 'off',
      'prefer-const': 'off',
    },
  }
);
