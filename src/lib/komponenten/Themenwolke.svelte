<script>
  import { groessenstufe } from '$lib/themenwolke.js';

  /**
   * Alle Themen als Wolke (ADR-0035): die Schriftgröße folgt der Häufigkeit
   * in fünf Stufen, in Primärblau — nicht in Orange, das trägt auf Weiß
   * keinen Text (ADR-0031). Die Anzahl steht sichtbar dabei, damit die
   * Größe nicht die einzige Auskunft ist. Übersichten gibt es nur deutsch
   * (ADR-0033, Punkt 5), der Hinweis ist deshalb ein Literal.
   *
   * @type {{ themen: Array<{ name: string, slug: string, anzahl: number }> }}
   */
  let { themen } = $props();
  const max = $derived(Math.max(0, ...themen.map((t) => t.anzahl)));
</script>

{#if themen.length === 0}
  <p class="hinweis">Noch kein Beitrag trägt ein Thema (<code>t</code>-Tag).</p>
{:else}
  <ul class="wolke">
    {#each themen as t (t.slug)}
      <li>
        <a href={`/themen/${t.slug}`} class={`thema stufe-${groessenstufe(t.anzahl, max)}`}>
          {t.name}<span class="anzahl">{t.anzahl}</span>
        </a>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .wolke {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 10px 22px;
  }
  .thema {
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
    font-weight: 500;
    letter-spacing: 0.02em;
    line-height: 1.2;
    color: var(--fb-primaer);
    text-decoration: none;
    transition: color var(--uebergang);
  }
  .thema:hover {
    color: var(--fb-ueberschrift);
    text-decoration: underline;
    text-decoration-color: var(--fb-akzent);
    text-underline-offset: 0.2em;
  }
  .anzahl {
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--fb-text-leise);
    letter-spacing: 0.06em;
  }
  .stufe-1 { font-size: 0.95rem; }
  .stufe-2 { font-size: 1.2rem; }
  .stufe-3 { font-size: 1.5rem; }
  .stufe-4 { font-size: 1.9rem; }
  .stufe-5 { font-size: 2.4rem; font-weight: 700; }
</style>
