// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Applies recommended rules for JS and TS
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // This one MUST be last to override other configs
  eslintConfigPrettier
);
