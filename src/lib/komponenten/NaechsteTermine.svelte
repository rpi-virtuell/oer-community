<script>
  import { t } from '$lib/sprache.js';
  import { zeitraumText } from '$lib/termin-anzeige.js';

  /**
   * Die nächsten Termine unter der Startseite (ADR-0034) — eine Zeile je
   * Termin, die auf seinen Anker in /termine führt. Die ganze Karte samt
   * Bild und Kalender-Link steht dort, nicht hier: die Startseite verweist,
   * sie verdoppelt nicht.
   *
   * Ohne Termine rendert der Block nichts. Eine leere Überschrift deutete
   * einen Kalender an, den es nicht gibt (CLAUDE.md) — anders als auf
   * /termine, wo der Hinweis die leere Liste erklärt.
   *
   * @type {{
   *   karten: Array<{ termin: { d: string, titel: string, start: Date, ende: Date|null, ganztaegig: boolean } }>,
   *   sprache?: 'de'|'en'
   * }}
   */
  let { karten, sprache = 'de' } = $props();
</script>

{#if karten.length > 0}
  <section class="naechste">
    <h2>{t(sprache, 'naechsteTermine')}</h2>
    <ul>
      {#each karten as karte (karte.termin.d)}
        <li>
          <a href="/termine#{karte.termin.d}">{karte.termin.titel}</a>
          <span class="metazeile">
            <time datetime={karte.termin.start.toISOString()}>{zeitraumText(karte.termin, sprache)}</time>
          </span>
        </li>
      {/each}
    </ul>
    <p><a class="marker" href="/termine">{t(sprache, 'alleTermine')}</a></p>
  </section>
{/if}

<style>
  .naechste {
    margin-top: 40px;
    padding-top: 28px;
    border-top: 1px solid var(--fb-rahmen);
  }
  .naechste h2 { margin-bottom: 16px; }
  .naechste ul { list-style: none; padding: 0; margin: 0 0 16px; }
  .naechste li {
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid var(--fb-rahmen);
  }
  .naechste li:last-child { border-bottom: none; }
  /* Datum unter den Titel, damit die Zeile auf schmalen Schirmen nicht bricht. */
  .naechste .metazeile { display: block; }
  .marker { text-decoration: none; }
</style>
