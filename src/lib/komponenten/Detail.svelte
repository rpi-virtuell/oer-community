<script>
  import Bildbereich from './Bildbereich.svelte';
  import DebugBereich from './DebugBereich.svelte';
  import { einstellungen } from '../einstellungen.svelte.js';
  import { kanonisch } from '$lib/kanonisch.js';
  import { t } from '$lib/sprache.js';

  /**
   * Die Seitendaten aus `routen/detail.js` (`seite`) — hier lokal typisiert,
   * damit diese Komponente keinen Typ aus routes/ importiert (CLAUDE.md).
   *
   * @type {{
   *   data: {
   *     artikel: { titel: string, zusammenfassung: string, veroeffentlicht: string,
   *       themen: string[], bildUrl: string|null, sprache: 'de'|'en', istSeite: boolean },
   *     lizenz: import('../models/lizenz.js').Ergebnis,
   *     teile: import('../inhalt.js').Teil[],
   *     fliesstext: Record<string, import('../models/lizenz.js').Ergebnis>,
   *     entfernteBilder: string[],
   *     befund: import('../models/entwickleransicht.js').Befund,
   *     pfad: string,
   *     sprache?: 'de'|'en',
   *     uebersetzung?: { pfad: string, sprache: 'de'|'en' }|null,
   *     stand: { zeitpunkt: string, nichtErreichbar: string[] }|null
   *   },
   *   wortmarke: string,
   *   nurWortmarke?: boolean,
   *   kanonischeUrl?: string|null,
   *   basisUrl?: string|null
   * }}
   */
  let { data, wortmarke, nurWortmarke = false, kanonischeUrl = null, basisUrl = null } = $props();

  /**
   * Alternates müssen absolut sein, sonst wertet keine Suchmaschine sie aus.
   * Ohne Basis (Tests) bleibt der Pfad, wie er ist.
   * @param {string} pfad
   */
  const absolut = (pfad) => (basisUrl ? kanonisch(basisUrl, pfad) : pfad);

  // $derived, nicht const: data ist ein Prop und aendert sich bei Navigation.
  // Sprache des Beitrags, nicht der Adresse: beide stimmen überein, weil
  // routen/detail.js einen Beitrag in der falschen Sprache weiterleitet.
  const datum = $derived(
    new Date(data.artikel.veroeffentlicht).toLocaleDateString(t(data.artikel.sprache, 'datumsformat'), {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  );
</script>

<svelte:head>
  {#if kanonischeUrl}
    <link rel="canonical" href={kanonischeUrl} />
  {/if}
  <title>{nurWortmarke ? wortmarke : `${data.artikel.titel} · ${wortmarke}`}</title>
  {#if data.artikel.zusammenfassung}
    <meta name="description" content={data.artikel.zusammenfassung} />
  {/if}
  <!-- Das Gegenstück in der anderen Sprache (ADR-0033), dazu der Selbstverweis:
       ein Alternate-Paar nennt beide Seiten, sonst gilt es als einseitig. -->
  {#if data.uebersetzung}
    <link rel="alternate" hreflang={data.uebersetzung.sprache} href={absolut(data.uebersetzung.pfad)} />
    <link
      rel="alternate"
      hreflang={data.artikel.sprache}
      href={kanonischeUrl ?? absolut(data.pfad)}
    />
  {/if}
</svelte:head>

<article>
  <header class="detail-kopf">
    <h1>{data.artikel.titel}</h1>
    {#if !data.artikel.istSeite}
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
    {/if}
  </header>

  {#if !data.artikel.istSeite}
    <Bildbereich
      lizenz={data.lizenz}
      titel={data.artikel.titel}
      bildUrl={data.artikel.bildUrl}
      sprache={data.artikel.sprache}
    />

    {#if data.artikel.zusammenfassung}
      <p class="vorspann">{data.artikel.zusammenfassung}</p>
    {/if}
  {/if}

  <!-- Markdown aus dem Event, in inhalt.js gesäubert und in Teile zerlegt:
       HTML-Segmente und Bilder mit Hash-URL (ADR-0023). Die Figur ist dieselbe
       wie beim Cover; der Alt-Text kommt aus dem Markdown, die Unterschrift
       aus dem Nachweis — oder, wenn der fehlt, aus der Zeile der Autor:in. -->
  <div class="inhalt">
    {#each data.teile as teil}
      {#if teil.art === 'html'}
        {@html teil.html}
      {:else}
        <Bildbereich
          lizenz={data.fliesstext[teil.hash] ?? { ok: false, grund: 'kein-nachweis' }}
          titel={data.artikel.titel}
          bildUrl={teil.url}
          altVorrang={teil.alt}
          unterschrift={teil.unterschrift}
          sprache={data.artikel.sprache}
        />
      {/if}
    {/each}
  </div>

  {#if data.entfernteBilder.length > 0}
    <p class="hinweis">
      {t(data.artikel.sprache, 'entfernteBilder', data.entfernteBilder.length)}
      {data.entfernteBilder.join(', ')}
    </p>
  {/if}

  <!-- Nur im Debug-Modus, umschaltbar in der Fusszeile (ADR-0017). -->
  {#if einstellungen.debugModus}
    <DebugBereich befund={data.befund} pfad={data.pfad} stand={data.stand} />
  {/if}
</article>

<style>
  .detail-kopf {
    padding-bottom: 28px;
    border-bottom: 1px solid var(--fb-rahmen);
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

  /* Fließtext des Beitrags — Regeln nach docs/designsystem.md */
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
    border-left: 3px solid var(--fb-akzent);
    margin: 1.4em 0;
    padding: 0.4em 0 0.4em 1.2em;
    color: var(--fb-text-leise);
  }
  .inhalt :global(code) {
    background: var(--fb-flaeche);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
  }
  .inhalt :global(pre) {
    background: var(--fb-flaeche);
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
    border: 1px solid var(--fb-rahmen);
    padding: 8px 12px;
    text-align: left;
  }
  .inhalt :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius);
    margin: 1.4em 0;
  }
</style>
