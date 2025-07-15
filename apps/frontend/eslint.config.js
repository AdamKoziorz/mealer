import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json'
        }
      }
    },
    extends: [
      importPlugin.flatConfigs.typescript,
      ...tseslint.configs.recommended
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'import/no-restricted-paths': [
        'error', {
          zones: [
            { target: '@shared', from: ['@entities', '@features', '@widgets', '@pages', '@app']},
            { target: '@entities', from: ['@features', '@widgets', '@pages', '@app']},
            { target: '@features', from: ['@widgets', '@pages', '@app']},
            { target: '@widgets', from: ['@pages', '@app']},
            { target: '@pages', from: ['@app']}
          ]
        }
      ]
    },
  },
)
