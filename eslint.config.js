import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

/**
 * ESLint prüft, was `svelte-check` nicht prüft: ungenutzte Variablen,
 * unerreichbarer Code, Svelte-Fallen wie fehlende `each`-Schlüssel.
 * Typen prüft weiter `pnpm check`; Formatierung ist hier kein Thema.
 */
export default [
  {
    ignores: ['build/', '.svelte-kit/', 'node_modules/', 'daten/spiegel.json', 'test-results/', 'playwright-report/']
  },
  js.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      // `_` am Anfang kennzeichnet bewusst ungenutzte Parameter.
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true }
      ],
      // Die Adressen sind das `d` der Beiträge (ADR-0029) und kommen aus den
      // Daten; einen `paths.base` gibt es nicht. resolve() prüfte hier nichts.
      'svelte/no-navigation-without-resolve': 'off'
    }
  }
];
