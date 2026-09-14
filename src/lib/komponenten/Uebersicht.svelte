<script>
  import Karte from './Karte.svelte';
  /** @type {{ karten: import('$lib/loaders/uebersicht.js').Karte[], seite: number, seiten: number, basis: string, ueberschrift: string, hinweis?: string|null }} */
  let { karten, seite, seiten, basis, ueberschrift, hinweis = null } = $props();
  const pfad = (/** @type {number} */ n) => (n <= 1 ? basis : `${basis}/seite/${n}`);
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

{#each karten as karte (karte.d)}
  <Karte {karte} />
{/each}

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
    padding-bottom: 28px;
    border-bottom: 1px solid var(--rl-linie);
    margin-bottom: 32px;
  }
  .seitenzahlen { justify-content: space-between; margin-top: 32px; }
  .seitenzahlen ul { display: flex; gap: 8px; list-style: none; padding: 0; margin: 0; width: 100%; flex-wrap: wrap; }
  .seitenzahlen [aria-current] { font-weight: 700; }
</style>
