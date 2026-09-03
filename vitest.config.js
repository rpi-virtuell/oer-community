import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // $lib loest SvelteKit sonst nur im vite-Lauf auf. Die Route unter
  // src/routes/ importiert damit, also muss der Alias auch im Test gelten.
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url))
    }
  },
  test: {
    // Der Test der Route liegt unter test/, nicht daneben: SvelteKit
    // verbietet in src/routes/ jede Datei mit +-Praefix, die keine Route ist.
    include: ['src/**/*.test.js', 'test/**/*.test.js'],
    environment: 'node'
  }
});
