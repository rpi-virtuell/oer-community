<script>
  /**
   * Rohdaten hinter einem Beitrag: kind:30023 und kind:1063 nebeneinander,
   * mit Relay-Herkunft, Prüfkette und Signaturbefund (ADR-0017).
   *
   * Aufbau übernommen von `EventDebugInfo.svelte` der edufeed-app —
   * Chevron, „Aktiv"-Marke beim Aufklappen, Abschnitte mit Kachelraster,
   * JSON-Block mit Kopier- und Ausklappknopf. **Inhaltlich anders:** Dort
   * steht ein Event, hier sind es zwei, und das Verhältnis der beiden ist
   * der Zweck der Ansicht.
   *
   * Farben aus `docs/designsystem.md`, nicht die DaisyUI-Token von edufeed:
   * dort sind die Kontrastwerte geprüft.
   *
   * `offenStart` gibt es allein, damit der aufgeklappte Zustand prüfbar ist:
   * serverseitig gerendert ist der Bereich zu, und ohne diesen Einstieg
   * liesse sich nur das Zugeklappte prüfen.
   *
   * @type {{
   *   befund: import('$lib/models/entwickleransicht.js').Befund,
   *   naddr: string,
   *   offenStart?: boolean
   * }}
   */
  let { befund, naddr, offenStart = false } = $props();

  import DebugFeld from './DebugFeld.svelte';
  import DebugRohblock from './DebugRohblock.svelte';

  // Nur der Startwert, absichtlich: Danach fuehrt der Klick den Zustand.
  // svelte-ignore state_referenced_locally
  let offen = $state(offenStart);

  /** Erste und letzte Zeichen — Hashes sind zu lang für eine Kachel. */
  const kurz = (/** @type {string|null} */ w) =>
    w && w.length > 20 ? `${w.slice(0, 8)}…${w.slice(-4)}` : (w ?? '—');

  /** Unix-Sekunden lesbar und roh, wie bei edufeed. */
  const zeit = (/** @type {number|undefined} */ s) =>
    s
      ? `${new Date(s * 1000).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })} (${s})`
      : '—';

  /** Bestanden, gescheitert, oder nicht geprueft. @param {boolean|null} ok */
  const zeichen = (ok) => (ok === true ? '✓' : ok === false ? '✗' : '·');

  /** Nur der Host, nicht das ganze wss://…/ — die Kachel ist schmal. */
  const host = (/** @type {string} */ url) => url.replace(/^wss:\/\//, '').replace(/\/$/, '');
</script>

<div class="rahmen" style="border-color: var(--rl-linie)">
  <button
    type="button"
    class="auslöser"
    onclick={() => (offen = !offen)}
    aria-expanded={offen}
    style="color: var(--rl-text)"
  >
    <svg class="chevron" class:gedreht={offen} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span class="titel">🔧 Debug-Informationen</span>
    {#if offen}
      <!-- Wie bei edufeed: zeigt den Aufklapp-Zustand, nicht den Modus.
           Neutral getönt — die einzige Marker-Variante, die bei kleiner
           Schrift die Kontrastanforderung erfüllt (5,40:1). -->
      <span class="marke" style="background: var(--rl-flaeche-2); color: var(--rl-text-leise)">
        Aktiv
      </span>
    {/if}
  </button>

  {#if offen}
    <div class="inhalt" style="background: var(--rl-flaeche)">
      <p class="hinweis" style="color: var(--rl-text-leise)">
        Der Lizenznachweis steht <strong>nicht</strong> im Beitrag. Der
        <code>kind:30023</code> trägt nur den Hash im <code>x</code>-Tag; der
        Nachweis ist ein eigenes <code>kind:1063</code> auf einem anderen
        Relay (ADR-0013).
        <a href="/{naddr}/json">Alles davon auch als JSON</a>.
      </p>

      <!-- ── Beitrag ────────────────────────────────────────────────── -->
      <section>
        <h4 style="color: var(--rl-text)">Beitrag (kind:30023)</h4>
        <div class="raster">
          <DebugFeld label="Event ID" wert={befund.artikel.event?.id}
                     kurz={kurz(befund.artikel.event?.id ?? null)} kopierbar />
          <DebugFeld label="Kind" wert={befund.artikel.event?.kind} />
          <DebugFeld label="Autor" wert={befund.artikel.event?.pubkey}
                     kurz={kurz(befund.artikel.event?.pubkey ?? null)} kopierbar />
          <DebugFeld label="Signatur" wert={befund.artikel.signatur ?? 'nicht prüfbar'} />
          <DebugFeld label="Erstellt" wert={zeit(befund.artikel.event?.created_at)} einspaltig />
          <DebugFeld label="naddr" wert={naddr} kurz={kurz(naddr)} kopierbar einspaltig />
        </div>
      </section>

      <!-- ── Lizenznachweis ─────────────────────────────────────────── -->
      <section>
        <h4 style="color: var(--rl-text)">Lizenznachweis (kind:1063)</h4>
        {#if befund.lizenz.event}
          <div class="raster">
            <DebugFeld label="Event ID" wert={befund.lizenz.event.id}
                       kurz={kurz(befund.lizenz.event.id)} kopierbar />
            <DebugFeld label="Signatur" wert={befund.lizenz.signatur ?? 'nicht prüfbar'} />
            <DebugFeld label="Kandidaten" wert={`${befund.lizenz.kandidaten} — ${befund.lizenz.auswahlgrund}`} einspaltig />
            <DebugFeld label="Erstellt" wert={zeit(befund.lizenz.event.created_at)} einspaltig />
          </div>
        {:else}
          <p class="fehlt" style="color: var(--rl-text-leise)">
            Kein Nachweis aufgelöst.
            {#if befund.lizenz.herkunft.grundText}{befund.lizenz.herkunft.grundText}{/if}
          </p>
        {/if}
      </section>

      <!-- ── Herkunft ───────────────────────────────────────────────── -->
      <section>
        <h4 style="color: var(--rl-text)">Auf welchem Relay lag was?</h4>
        <div class="raster">
          <DebugFeld label="Beitrag von"
                     wert={befund.artikel.herkunft.geliefertVon.map(host).join(', ') || '—'}
                     einspaltig />
          <DebugFeld label="Nachweis von"
                     wert={befund.lizenz.herkunft.geliefertVon.map(host).join(', ') || '—'}
                     einspaltig />
          {#if befund.lizenz.herkunft.artikelRelaysOhneNachweis?.length}
            <DebugFeld label="hat den Beitrag, nicht den Nachweis"
                       wert={befund.lizenz.herkunft.artikelRelaysOhneNachweis.map(host).join(', ')}
                       einspaltig />
          {/if}
          {#if befund.lizenz.herkunft.nichtErreichbar.length}
            <DebugFeld label="nicht erreichbar"
                       wert={befund.lizenz.herkunft.nichtErreichbar.map(host).join(', ')}
                       einspaltig />
          {/if}
        </div>
      </section>

      <!-- ── Prüfkette ─────────────────────────────────────────────── -->
      <section>
        <h4 style="color: var(--rl-text)">
          Prüfkette (ADR-0013)
          <span class="ergebnis" style="color: var(--rl-text-leise)">
            {befund.kette.ok ? 'vollständig bestanden' : (befund.kette.text ?? '')}
          </span>
        </h4>
        <ol class="kette">
          {#each befund.kette.schritte as schritt (schritt.nr)}
            <li style="background: var(--rl-weiss); border-color: var(--rl-linie)">
              <span class="zeichen" aria-hidden="true">{zeichen(schritt.ok)}</span>
              <span class="frage" style="color: var(--rl-text)">
                {schritt.frage}
                <span class="sr">
                  {schritt.ok === true ? '— bestanden' : schritt.ok === false ? '— gescheitert' : '— nicht geprüft'}
                </span>
              </span>
              <code class="wert" style="color: var(--rl-text-leise)">
                {schritt.wert ? (schritt.wert.length > 26 ? kurz(schritt.wert) : schritt.wert) : '—'}
              </code>
            </li>
          {/each}
        </ol>
        <p class="fussnote" style="color: var(--rl-text-leise)">
          <span aria-hidden="true">·</span> heißt nicht geprüft — ein früherer
          Schritt brach ab, oder Schritt 5 hatte keinen <code>etag</code>.
        </p>
      </section>

      <!-- ── Hashes ────────────────────────────────────────────────── -->
      <section>
        <h4 style="color: var(--rl-text)">Die drei Hashes müssen gleich sein</h4>
        <div class="raster">
          <DebugFeld label="am Beitrag (x-Tag)" wert={befund.hashes.amArtikel}
                     kurz={kurz(befund.hashes.amArtikel)} kopierbar einspaltig />
          <DebugFeld label="am Nachweis" wert={befund.hashes.amNachweis}
                     kurz={kurz(befund.hashes.amNachweis)} kopierbar einspaltig />
          <DebugFeld label="am gelieferten Bild (etag)" wert={befund.hashes.amBild}
                     kurz={kurz(befund.hashes.amBild)} kopierbar einspaltig />
        </div>
      </section>

      <!-- ── Rohdaten ──────────────────────────────────────────────── -->
      <section>
        <DebugRohblock titel="Beitrag als Nostr-Event" daten={befund.artikel.event} />
      </section>
      {#if befund.lizenz.event}
        <section>
          <DebugRohblock titel="Lizenznachweis als Nostr-Event" daten={befund.lizenz.event} />
        </section>
      {/if}
    </div>
  {/if}
</div>

<style>
  .rahmen {
    margin-top: 3rem;
    border-top-width: 1px;
    border-top-style: solid;
    padding-top: 1rem;
  }
  .auslöser {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    width: 100%;
    text-align: left;
  }
  .chevron {
    width: 1rem;
    height: 1rem;
    flex: none;
    transition: transform 0.2s;
  }
  .chevron.gedreht {
    transform: rotate(90deg);
  }
  .titel {
    font-size: 0.95rem;
    font-weight: 700;
  }
  .marke {
    font-size: 0.72rem;
    border-radius: 999px;
    padding: 0.125rem 0.5rem;
  }
  .inhalt {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-top: 0.75rem;
  }
  .hinweis {
    font-size: 0.82rem;
    line-height: 1.55;
  }
  h4 {
    font-size: 0.86rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  .ergebnis {
    font-weight: 400;
    font-size: 0.8rem;
  }
  .raster {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  @media (min-width: 640px) {
    .raster {
      grid-template-columns: 1fr 1fr;
    }
  }
  .kette {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  .kette li {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    border-width: 1px;
    border-style: solid;
    border-radius: 0.375rem;
    padding: 0.5rem 0.625rem;
    font-size: 0.82rem;
  }
  .zeichen {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    flex: none;
    width: 1rem;
    text-align: center;
  }
  .frage {
    flex: 1;
    min-width: 0;
  }
  .kette .wert {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.76rem;
    flex: none;
    white-space: nowrap;
  }
  .fehlt,
  .fussnote {
    font-size: 0.8rem;
    line-height: 1.5;
  }
  .fussnote {
    margin-top: 0.5rem;
  }
  /* Das Zeichen ist dekorativ; die Aussage braucht Worte fuer Vorleser. */
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
