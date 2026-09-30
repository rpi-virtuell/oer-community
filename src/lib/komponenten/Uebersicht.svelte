<script>
  import Karte from './Karte.svelte';
  // Übersichten gibt es nur deutsch (ADR-0033, Punkt 5); Texte deshalb
  // bewusst als Literal.
  /** @type {{ karten: import('$lib/loaders/uebersicht.js').Karte[], seite: number, seiten: number, basis: string, ueberschrift: string, hinweis?: string|null }} */
  let { karten, seite, seiten, basis, ueberschrift, hinweis = null } = $props();
  const pfad = (/** @type {number} */ n) => (n <= 1 ? basis : `${basis}/seite/${n}`);
  // Auf Seite 1 ist der neueste Beitrag der Aufmacher (ADR-0040); auf den
  // Folgeseiten stehen alle im Raster — ein zweiter Aufmacher wäre keiner.
  const aufmacher = $derived(seite === 1 ? karten[0] ?? null : null);
  const raster = $derived(aufmacher ? karten.slice(1) : karten);
</script>

<header class="detail-kopf">
  <h1>{ueberschrift}</h1>
</header>

{#if hinweis}
  <p class="hinweis">{hinweis}</p>
{/if}

{#if karten.length === 0 && !hinweis}
  <p class="hinweis">Hier gibt es noch keinen Beitrag.</p>
{/if}

{#if aufmacher}
  <Karte karte={aufmacher} aufmacher />
{/if}

{#if raster.length > 0}
  <div class="raster">
    {#each raster as karte (karte.d)}
      <Karte {karte} />
    {/each}
  </div>
{/if}

{#if seiten > 1}
  <nav class="seitenzahlen metazeile" aria-label="Seiten">
    {#if seite > 1}<a href={pfad(seite - 1)} rel="prev">← Neuere</a>{/if}
    <span>Seite {seite} von {seiten}</span>
    {#if seite < seiten}<a href={pfad(seite + 1)} rel="next">Ältere →</a>{/if}
    <ul>
      {#each Array.from({ length: seiten }, (_, i) => i + 1) as n (n)}
        <li>{#if n === seite}<span aria-current="page">{n}</span>{:else}<a href={pfad(n)}>{n}</a>{/if}</li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  .detail-kopf {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--fb-rahmen);
    margin-bottom: 32px;
  }
  .detail-kopf h1 { margin: 0; }
  .raster {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
    margin-top: 20px;
  }
  @media (max-width: 1024px) {
    .raster { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .raster { grid-template-columns: 1fr; }
  }
  .seitenzahlen { justify-content: space-between; margin-top: 40px; }
  .seitenzahlen ul { display: flex; gap: 8px; list-style: none; padding: 0; margin: 0; width: 100%; flex-wrap: wrap; }
  .seitenzahlen [aria-current] { font-weight: 700; }
</style>
