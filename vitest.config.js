import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Nur das Svelte-Plugin, nicht sveltekit(): Komponenten sollen im Test
  // kompilierbar sein, ohne dass der SvelteKit-Router mitlaeuft.
  plugins: [svelte({ hot: false })],
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
    environment: 'node',
    // Komponenten werden serverseitig gerendert (svelte/server) — dieselbe
    // Darstellung, die der Server ausliefert (ADR-0003).
    server: { deps: { inline: ['svelte'] } }
  }
});
