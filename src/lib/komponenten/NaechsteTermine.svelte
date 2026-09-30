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
  <!-- Das blaue Panel aus dem Landing-Entwurf (ADR-0040): weißer Text,
       oranges Datum-Label — beide Paare in test/kontrast.test.js. -->
  <section class="naechste panel">
    <h2>{t(sprache, 'naechsteTermine')}</h2>
    <ul>
      {#each karten as karte (karte.termin.d)}
        <li>
          <p class="label">
            <time datetime={karte.termin.start.toISOString()}>{zeitraumText(karte.termin, sprache)}</time>
          </p>
          <a href="/termine#{encodeURIComponent(karte.termin.d)}">{karte.termin.titel}</a>
        </li>
      {/each}
    </ul>
    <p class="alle"><a href="/termine">{t(sprache, 'alleTermine')} →</a></p>
  </section>
{/if}

<style>
  .naechste {
    margin-top: 56px;
    padding: 40px 44px;
  }
  .naechste h2 {
    margin-bottom: 24px;
  }
  .naechste ul {
    list-style: none;
    padding: 0;
    margin: 0 0 24px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px 32px;
  }
  .naechste li {
    padding-top: 14px;
    border-top: 1px solid color-mix(in srgb, var(--fb-weiss) 25%, transparent);
  }
  .naechste li .label {
    display: block;
    margin-bottom: 8px;
  }
  .naechste li a {
    display: block;
    font-size: 1.15rem;
    font-weight: 700;
    line-height: 1.25;
    text-decoration: none;
  }
  .naechste li a:hover {
    text-decoration: underline;
  }
  .alle {
    margin: 0;
    font-size: 0.86rem;
    letter-spacing: 0.06em;
  }
  @media (max-width: 640px) {
    .naechste { padding: 28px 24px; }
  }
</style>
