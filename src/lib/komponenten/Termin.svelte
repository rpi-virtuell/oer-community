<script module>
  /**
   * Eine Terminkarte, wie `loaders/termine.js` sie liefert — hier lokal
   * typisiert, damit Komponenten nichts aus lib/loaders importieren
   * (CLAUDE.md, ADR-0014). Termine.svelte reicht denselben Typ durch.
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

  /**
   * Ein Termin der Community (ADR-0034). Der Hub ist lesend: er zeigt den
   * Termin und führt zum Eintragen in die edufeed-app — hier gibt es keine
   * Anmeldung (CLAUDE.md).
   *
   * @type {{ karte: TerminkarteProp, sprache?: 'de'|'en' }}
   */
  let { karte, sprache = 'de' } = $props();

  const locale = $derived(t(sprache, 'datumsformat'));

  /** Ganztägig: reines Datum (die Zeitzone steckt nicht im Event). @param {Date} d */
  const tag = (d) => d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  /** Zeitgebunden: Datum und Uhrzeit in Berliner Zeit. @param {Date} d */
  const zeit = (d) =>
    d.toLocaleString(locale, {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin'
    });
  /** Nur die Uhrzeit — für das Ende am selben Tag. @param {Date} d */
  const uhrzeit = (d) =>
    d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
  /** Berliner Kalendertag, um „selber Tag" zu entscheiden. @param {Date} d */
  const berlinerTag = (d) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

  /**
   * Der Zeitraum als eine Zeile. Gleicher Tag heißt ein Datum; bei
   * ganztägigen Terminen nennt die erste Angabe nur den Tag
   * („2.–3. Februar 2027"), weil Monat und Jahr sich nicht ändern.
   */
  const zeitraum = $derived.by(() => {
    const { start, ende, ganztaegig } = karte.termin;
    if (!ende || ende.getTime() === start.getTime()) return ganztaegig ? tag(start) : zeit(start);
    if (ganztaegig) {
      const gleicherMonat =
        start.getUTCFullYear() === ende.getUTCFullYear() && start.getUTCMonth() === ende.getUTCMonth();
      return gleicherMonat ? `${start.getUTCDate()}.–${tag(ende)}` : `${tag(start)} – ${tag(ende)}`;
    }
    // Endet der Termin am selben Tag, genügt die Uhrzeit — das Datum zweimal
    // zu nennen liest sich wie zwei Termine.
    return berlinerTag(start) === berlinerTag(ende)
      ? `${zeit(start)} – ${uhrzeit(ende)}`
      : `${zeit(start)} – ${zeit(ende)}`;
  });

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
