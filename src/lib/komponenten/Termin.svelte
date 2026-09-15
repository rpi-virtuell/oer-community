<script module>
  /**
   * Eine Terminkarte, wie `loaders/termine.js` sie liefert. Reine Typimporte
   * aus lib/loaders wären erlaubt (Uebersicht.svelte tut das) — die lokale
   * Typdefinition ist hier eine Lesbarkeitswahl, keine Regel: sie nennt
   * genau die Felder, die diese Komponente anfasst. Termine.svelte reicht
   * denselben Typ durch.
   *
   * @typedef {object} TerminkarteProp
   * @property {{ d: string, titel: string, zusammenfassung: string, inhalt: string,
   *   start: Date, ende: Date|null, ganztaegig: boolean, orte: string[] }} termin
   * @property {{ url: string, alt: string, lizenz: import('$lib/models/lizenz.js').Ergebnis }|null} bild
   * @property {string} kalenderUrl
   */
</script>

<script>
  import Bildbereich from './Bildbereich.svelte';
  import { t } from '$lib/sprache.js';
  import { zeitraumText } from '$lib/termin-anzeige.js';

  /**
   * Ein Termin der Community (ADR-0034). Der Hub ist lesend: er zeigt den
   * Termin und führt zum Eintragen in die edufeed-app — hier gibt es keine
   * Anmeldung (CLAUDE.md).
   *
   * @type {{ karte: TerminkarteProp, sprache?: 'de'|'en' }}
   */
  let { karte, sprache = 'de' } = $props();

  const zeitraum = $derived(zeitraumText(karte.termin, sprache));

  const absaetze = $derived(
    (karte.termin.zusammenfassung || karte.termin.inhalt)
      .split('\n\n')
      .map((a) => a.trim())
      .filter((a) => a !== '')
  );
</script>

<article class="termin" id={karte.termin.d}>
  <h3>{karte.termin.titel}</h3>
  <p class="metazeile">
    <time datetime={karte.termin.start.toISOString()}>{zeitraum}</time>
    {#if karte.termin.ganztaegig}<span aria-hidden="true">·</span><span>{t(sprache, 'ganztaegig')}</span>{/if}
    {#each karte.termin.orte as ort (ort)}
      <span aria-hidden="true">·</span><span>{ort}</span>
    {/each}
  </p>
  {#if karte.bild}
    <!-- Bildbereich zeigt die Lizenzpille und den Stand (ADR-0022, ADR-0032). -->
    <Bildbereich lizenz={karte.bild.lizenz} titel={karte.termin.titel} bildUrl={karte.bild.url} altVorrang={karte.bild.alt} {sprache} />
  {/if}
  {#each absaetze as absatz, i (i)}
    <p>{absatz}</p>
  {/each}
  <!-- Anmelden und Eintragen geschieht in der edufeed-app; der Hub liest nur. -->
  <p><a class="marker" href={karte.kalenderUrl} rel="noopener" target="_blank">{t(sprache, 'imKalender')}</a></p>
</article>

<style>
  .termin {
    border-bottom: 1px solid var(--fb-rahmen);
    padding-bottom: 24px;
    margin-bottom: 24px;
  }
  .termin h3 { font-size: 1.5rem; margin-bottom: 6px; }
  .termin p { margin-bottom: 10px; }
  .marker { text-decoration: none; }
</style>
