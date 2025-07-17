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
          project: './tsconfig.app.json'
        }
      }
    },
    extends: [
      importPlugin.flatConfigs.typescript,
      ...tseslint.configs.recommendedTypeChecked
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
            { target: 'src/shared', from: ['src/entities', 'src/features', 'src/widgets', 'src/pages', 'src/app']},
            { target: 'src/entities', from: ['src/features', 'src/widgets', 'src/pages', 'src/app']},
            { target: 'src/features', from: ['src/widgets', 'src/pages', 'src/app']},
            { target: 'src/widgets', from: ['src/pages', 'src/app']},
            { target: 'src/pages', from: ['src/app']},
          ]
        }
      ]
    },
  },
)
