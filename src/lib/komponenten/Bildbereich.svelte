<script>
  import { GRUND_TEXT } from '$lib/models/lizenz.js';
  import Lizenzzeile from './Lizenzzeile.svelte';

  /** @type {{ lizenz: import('$lib/models/lizenz.js').Ergebnis, titel: string }} */
  let { lizenz, titel } = $props();
</script>

{#if lizenz.ok}
  <figure class="my-6">
    <img
      src={lizenz.nachweis.url}
      alt={lizenz.nachweis.titel ?? titel}
      class="w-full rounded"
    />
    <figcaption class="mt-2 text-sm" style="color: var(--rl-text-leise)">
      <Lizenzzeile nachweis={lizenz.nachweis} />
    </figcaption>
  </figure>
{:else if lizenz.grund !== 'kein-bild'}
  <p
    class="my-6 rounded border p-3 text-sm"
    style="border-color: var(--rl-linie); background: var(--rl-flaeche); color: var(--rl-text-leise)"
  >
    <strong>Bild nicht angezeigt.</strong> {GRUND_TEXT[lizenz.grund]}
  </p>
{/if}
