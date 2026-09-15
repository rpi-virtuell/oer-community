<script>
  import Lizenzpille from './Lizenzpille.svelte';
  /** @type {{ karte: import('$lib/loaders/uebersicht.js').Karte }} */
  let { karte } = $props();
  const datum = $derived(new Date(karte.veroeffentlicht).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }));
</script>

<article class="karte">
  {#if karte.cover}
    <!-- Cover mit Lizenzstand als Pille (ADR-0032). Der Bild-Link ist
         aria-hidden (der Titel darunter ist der Link); die Pille steht deshalb
         neben ihm, nicht darin. Die verlinkte Attribution steht auf der
         Artikelseite. -->
    <div class="cover">
      <a href={karte.pfad} tabindex="-1" aria-hidden="true">
        <img src={karte.cover.url} alt={karte.cover.alt} loading="lazy" />
      </a>
      <Lizenzpille lizenz={karte.cover.lizenz} />
    </div>
  {/if}
  <div class="text">
    <h2><a href={karte.pfad}>{karte.titel}</a></h2>
    <p class="metazeile"><time datetime={karte.veroeffentlicht}>{datum}</time></p>
    {#if karte.zusammenfassung}<p class="anriss">{karte.zusammenfassung}</p>{/if}
    {#if karte.themen.length > 0}
      <ul class="metazeile themen">
        {#each karte.themen as thema (thema.slug)}
          <li><a class="marker" href={`/themen/${thema.slug}`}>{thema.name}</a></li>
        {/each}
      </ul>
    {/if}
  </div>
</article>

<style>
  .karte { border: 1px solid var(--fb-rahmen); border-radius: var(--radius); overflow: hidden; margin-bottom: 24px; background: var(--fb-weiss); }
  .cover { position: relative; }
  .cover a { display: block; }
  .cover img { display: block; width: 100%; height: auto; max-height: 360px; object-fit: cover; }
  .text { padding: 20px 24px 24px; }
  h2 { font-size: 1.5rem; margin-bottom: 6px; }
  h2 a { color: inherit; text-decoration: none; }
  h2 a:hover { text-decoration: underline; }
  .anriss { margin: 10px 0 12px; }
  .themen { list-style: none; padding: 0; margin: 0 0 8px; }
  .marker { text-decoration: none; }
</style>
