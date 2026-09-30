<script>
  /**
   * Fußzeile: Wortmarke, Fußtext und Links aus kind:0/kind:30004 (ADR-0027),
   * der Debug-Schalter und — im Debug-Modus — der Struktur-Befund.
   *
   * Der Schalter liegt hier und nicht auf einer Einstellungsseite: Eine
   * solche wäre Verwaltung und damit ausserhalb des Zuschnitts (CLAUDE.md).
   * Die edufeed-app hat ihn unter „Entwickler-Einstellungen" in /settings —
   * dieselbe Mechanik (Rune plus localStorage), nur ein anderer Ort.
   *
   * Kein Relay-Name im Text: Adressen sind Konfiguration, kein Code. Der
   * Struktur-Befund nennt erwartete Events und Kennungen (kind, d), keine
   * Relays.
   */
  import { onMount } from 'svelte';

  import { einstellungen } from '$lib/einstellungen.svelte.js';

  /**
   * @type {{ wortmarke: string, fusstextHtml?: string|null,
   *   links?: import('$lib/loaders/struktur.js').Eintrag[],
   *   befund?: import('$lib/loaders/struktur.js').Struktur['befund']|null,
   *   spiegelstand?: { zeitpunkt: string|null, veraltet: boolean, relays: string[] },
   *   debugStart?: boolean }}
   */
  let {
    wortmarke,
    fusstextHtml = null,
    links = [],
    befund = null,
    spiegelstand = { zeitpunkt: null, veraltet: false, relays: [] },
    debugStart = false
  } = $props();

  const debug = $derived(einstellungen.debugModus || debugStart);

  const BAUSTEINE = /** @type {const} */ ([
    ['profil', 'Profil (Wortmarke, Logo, Fußtext)'],
    ['navigation', 'Hauptmenü'],
    ['fusszeile', 'Fußzeilenlinks'],
    ['startseite', 'Startseite']
  ]);

  // Erst im Browser: Der Server kennt localStorage nicht, und ein
  // abweichender Startwert wäre ein Unterschied zur Serverdarstellung.
  onMount(() => einstellungen.ausSpeicherLaden());
</script>

<footer class="fuss">
  <div class="innen">
    <p class="marke">{wortmarke}</p>
    {#if fusstextHtml}
      <!-- Gesäubertes HTML aus inhaltAufbereiten (Task 6) — deshalb erlaubt in {@html}. -->
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <div class="text">{@html fusstextHtml}</div>
    {:else}
      <p class="text">
        Schaufenster für Beiträge im Nostr-Netz. Jeder Beitrag ist ein signiertes
        Event unter seiner stabilen Adresse (<code>d</code>), ein
        <code>naddr</code> leitet dorthin weiter.
      </p>
    {/if}
    {#if links.length > 0}
      <ul class="links">
        {#each links as l (l.pfad)}
          <li><a href={l.pfad}>{l.titel}</a></li>
        {/each}
      </ul>
    {/if}
    {#if spiegelstand.veraltet}
      <p class="stand">
        <strong>
          Stand: {spiegelstand.zeitpunkt ? new Date(spiegelstand.zeitpunkt).toLocaleString('de-DE') : 'unbekannt'}
        </strong>
        — kein Relay erreichbar ({spiegelstand.relays.join(', ')}). Der Dienst zeigt den letzten gültigen
        Stand und versucht es weiter.
      </p>
    {/if}
    <div class="werkzeug">
      <label class="schalter">
        <input
          type="checkbox"
          checked={einstellungen.debugModus}
          onchange={() => einstellungen.debugModusUmschalten()}
        />
        <span>Debug-Modus</span>
      </label>
      <span class="erklaerung">zeigt die Rohdaten von Beitrag und Lizenznachweis an</span>
    </div>
    {#if debug && befund}
      <section class="befund" aria-label="Struktur aus Nostr">
        <h2>Struktur aus Nostr (ADR-0027)</h2>
        <ul>
          {#each BAUSTEINE as [schluessel, name] (schluessel)}
            <li>{name}: {befund[schluessel] === 'ok' ? 'ok' : `fehlt — erwartet: ${befund.erwartet[schluessel]}`}</li>
          {/each}
        </ul>
        {#if befund.uebersprungen.length > 0}
          <p>Übersprungene Listenziele:</p>
          <!-- Nach Index geschlüsselt: zweimal dasselbe übersprungene Ziel ist möglich,
               ein doppelter Schlüssel bräche die Hydration (each_key_duplicate). -->
          <ul>{#each befund.uebersprungen as z, i (i)}<li>{z}</li>{/each}</ul>
        {/if}
      </section>
    {/if}
  </div>
</footer>

<style>
  .fuss {
    background: var(--fb-flaeche);
    color: var(--fb-text);
    border-top: 1px solid var(--fb-akzent);
    margin-top: 64px;
    padding: 48px 0;
    font-size: 0.92rem;
  }
  .innen {
    max-width: var(--breite-container);
    margin: 0 auto;
    padding: 0 24px;
  }
  .marke {
    font-family: var(--schrift);
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--fb-ueberschrift);
    margin: 0 0 12px;
  }
  .text {
    max-width: 60ch;
    margin: 0;
  }
  .text :global(a) {
    color: var(--fb-primaer);
    text-decoration: underline;
  }
  .links {
    display: flex;
    gap: 16px;
    list-style: none;
    padding: 0;
    margin: 16px 0 0;
  }
  .links a {
    color: var(--fb-primaer);
  }
  .stand {
    max-width: 60ch;
    margin: 12px 0 0;
    padding: 12px;
    background: var(--fb-weiss);
    border-left: 3px solid var(--fb-akzent);
    font-size: 0.92rem;
  }
  .werkzeug {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
    margin-top: 28px;
    padding-top: 16px;
    border-top: 1px solid var(--fb-rahmen);
    font-family: var(--schrift);
    font-size: 0.86rem;
  }
  .schalter {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: var(--fb-text);
  }
  .schalter input {
    accent-color: var(--fb-primaer);
  }
  .erklaerung {
    font-size: 0.8rem;
  }
  .befund {
    margin-top: 20px;
    font-family: var(--schrift);
    font-size: 0.86rem;
  }
  .befund h2 {
    font-size: 1rem;
    color: var(--fb-ueberschrift);
    margin: 0 0 6px;
  }
  .befund ul {
    padding-left: 1.2em;
  }
</style>
