<script>
  import Bildbereich from '$lib/komponenten/Bildbereich.svelte';
  import DebugBereich from '$lib/komponenten/DebugBereich.svelte';
  import { einstellungen } from '$lib/einstellungen.svelte.js';

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();

  // $derived, nicht const: data ist ein Prop und aendert sich bei Navigation.
  const datum = $derived(
    new Date(data.artikel.veroeffentlicht).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  );
</script>

<svelte:head>
  <title>{data.artikel.titel} — community-hub</title>
  <meta name="description" content={data.artikel.zusammenfassung} />
</svelte:head>

<article>
  <header class="detail-kopf">
    <h1>{data.artikel.titel}</h1>
    <div class="metazeile">
      <time datetime={data.artikel.veroeffentlicht}>{datum}</time>
      {#if data.artikel.themen.length > 0}
        <ul class="themen">
          {#each data.artikel.themen as thema (thema)}
            <li class="marker">{thema}</li>
          {/each}
        </ul>
      {/if}
    </div>
  </header>

  <Bildbereich lizenz={data.lizenz} titel={data.artikel.titel} />

  {#if data.artikel.zusammenfassung}
    <p class="vorspann">{data.artikel.zusammenfassung}</p>
  {/if}

  <!-- Markdown aus dem Event; in inhalt.js gesäubert. -->
  <div class="inhalt">{@html data.html}</div>

  {#if data.entfernteBilder.length > 0}
    <p class="hinweis">
      <strong>
        {data.entfernteBilder.length} Bildverweis{data.entfernteBilder.length === 1 ? '' : 'e'}
        im Text nicht angezeigt.
      </strong>
      Bilder im Fließtext tragen keinen Lizenznachweis und werden deshalb nicht
      ausgeliefert (ADR-0015): {data.entfernteBilder.join(', ')}
    </p>
  {/if}

  <!-- Nur im Debug-Modus, umschaltbar in der Fusszeile (ADR-0017). -->
  {#if einstellungen.debugModus}
    <DebugBereich befund={data.befund} naddr={data.naddr} />
  {/if}
</article>

<style>
  .detail-kopf {
    padding-bottom: 28px;
    border-bottom: 1px solid var(--rl-linie);
    margin-bottom: 32px;
  }
  .detail-kopf h1 {
    margin-bottom: 14px;
  }
  .themen {
    display: contents;
  }
  .vorspann {
    font-size: 1.15rem;
    line-height: 1.55;
    margin: 0 0 1.5rem;
  }

  /* Fließtext des Beitrags — Regeln aus mockup/index.html, .inhalt */
  .inhalt {
    font-size: 1.02rem;
  }
  .inhalt :global(h2),
  .inhalt :global(h3),
  .inhalt :global(h4),
  .inhalt :global(h5),
  .inhalt :global(h6) {
    margin-top: 1.6em;
  }
  .inhalt :global(h5),
  .inhalt :global(h6) {
    font-size: 1.1rem;
  }
  .inhalt :global(p) {
    margin-bottom: 1rem;
  }
  .inhalt :global(a) {
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }
  .inhalt :global(ul),
  .inhalt :global(ol) {
    margin-bottom: 1rem;
    padding-left: 1.4em;
  }
  .inhalt :global(ul) {
    list-style: disc;
  }
  .inhalt :global(ol) {
    list-style: decimal;
  }
  .inhalt :global(li) {
    margin-bottom: 0.25rem;
  }
  .inhalt :global(blockquote) {
    border-left: 3px solid var(--relilab);
    margin: 1.4em 0;
    padding: 0.4em 0 0.4em 1.2em;
    color: var(--rl-text-leise);
  }
  .inhalt :global(code) {
    background: var(--rl-flaeche);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
  }
  .inhalt :global(pre) {
    background: var(--rl-flaeche);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1.4em 0;
  }
  .inhalt :global(pre code) {
    background: none;
    padding: 0;
  }
  .inhalt :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.4em 0;
  }
  .inhalt :global(td),
  .inhalt :global(th) {
    border: 1px solid var(--rl-linie);
    padding: 8px 12px;
    text-align: left;
  }
  .inhalt :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1.4em 0;
  }
</style>
