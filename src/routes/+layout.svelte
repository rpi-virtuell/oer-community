<script>
  import '../app.css';
  import { page } from '$app/state';

  import Kopfzeile from '$lib/komponenten/Kopfzeile.svelte';
  import Fusszeile from '$lib/komponenten/Fusszeile.svelte';
  import { startPfad } from '$lib/sprache.js';

  /** @type {{ children: import('svelte').Snippet, data: import('./$types').LayoutData }} */
  let { children, data } = $props();

  const andere = $derived(data.struktur.sprache === 'de' ? 'en' : 'de');
  // Ziel des Umschalters: das Gegenstück dieser Seite, sonst die Startseite
  // der anderen Sprache (ADR-0033). `page.data` trägt Layout- und Seitendaten
  // zusammen; `uebersetzung` kommt nur von Detailseiten.
  const wechselPfad = $derived(page.data.uebersetzung?.pfad ?? startPfad(andere));
</script>

<Kopfzeile
  wortmarke={data.struktur.wortmarke}
  logoUrl={data.struktur.logoUrl}
  menue={data.struktur.menue}
  aktuellerPfad={page.url.pathname}
  sprache={data.struktur.sprache}
  zweisprachig={data.struktur.zweisprachig}
  {wechselPfad}
/>
<!-- Breit für Übersichten und Startseite (ADR-0035), sonst Lesebreite;
     die Seite sagt es über ihre Daten (`breit`). -->
<main class:breit={page.data.breit === true}>
  {@render children()}
</main>
<Fusszeile
  wortmarke={data.struktur.wortmarke}
  fusstextHtml={data.struktur.fusstextHtml}
  links={data.struktur.fusszeilenLinks}
  befund={data.struktur.befund}
  spiegelstand={data.spiegelstand}
/>

<style>
  /* Lesebreite aus dem Designsystem: 820px; Rasterbreite 1240px. */
  main {
    max-width: var(--breite-schmal);
    margin: 0 auto;
    padding: 40px 24px 0;
  }
  main.breit {
    max-width: var(--breite-raster);
  }
</style>
