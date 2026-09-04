<script>
  import { GRUND_TEXT } from '$lib/models/lizenz.js';
  import Lizenzzeile from './Lizenzzeile.svelte';

  /** @type {{ lizenz: import('$lib/models/lizenz.js').Ergebnis, titel: string }} */
  let { lizenz, titel } = $props();
</script>

{#if lizenz.ok}
  <!-- Redaktionelle Bilder liegen auf Blossom in voller Größe (ADR-0010):
       volle Breite ist richtig. Die 150px-Thumbnails des relilab-Altbestands
       wären ein anderer Fall — der ist hier noch nicht in Betrieb. -->
  <figure class="bild">
    <img src={lizenz.nachweis.url} alt={lizenz.nachweis.titel ?? titel} />
    <figcaption class="metazeile">
      <Lizenzzeile nachweis={lizenz.nachweis} />
    </figcaption>
  </figure>
{:else if lizenz.grund !== 'kein-bild'}
  <p class="hinweis">
    <strong>Bild nicht angezeigt.</strong>
    {GRUND_TEXT[lizenz.grund]}
  </p>
{/if}

<style>
  .bild {
    margin: 0 0 32px;
  }
  .bild img {
    width: 100%;
    height: auto;
    border-radius: 8px;
  }
  .bild figcaption {
    margin-top: 10px;
    display: block;
  }
</style>
