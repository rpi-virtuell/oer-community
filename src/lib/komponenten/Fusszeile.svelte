<script>
  /**
   * Fußzeile: Wortmarke, ein Satz zur Herkunft, der Debug-Schalter.
   *
   * Der Schalter liegt hier und nicht auf einer Einstellungsseite: Eine
   * solche wäre Verwaltung und damit ausserhalb des Zuschnitts (CLAUDE.md).
   * Die edufeed-app hat ihn unter „Entwickler-Einstellungen" in /settings —
   * dieselbe Mechanik (Rune plus localStorage), nur ein anderer Ort.
   *
   * Kein Relay-Name im Text: Adressen sind Konfiguration, kein Code.
   */
  import { onMount } from 'svelte';

  import { einstellungen } from '$lib/einstellungen.svelte.js';

  // Erst im Browser: Der Server kennt localStorage nicht, und ein
  // abweichender Startwert wäre ein Unterschied zur Serverdarstellung.
  onMount(() => einstellungen.ausSpeicherLaden());
</script>

<footer class="fuss">
  <div class="innen">
    <!-- Wortmarke vorläufig, bis es ein Branding gibt (ADR-0019). -->
    <p class="marke">Community-<span>Hub</span></p>
    <p class="text">
      Schaufenster für Beiträge im Nostr-Netz. Jeder Beitrag ist ein signiertes
      Event unter einer stabilen <code>naddr</code>-Adresse.
    </p>
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
  </div>
</footer>

<style>
  .fuss {
    background: var(--fau);
    color: var(--fuss-text);
    margin-top: 64px;
    padding: 48px 0;
    font-size: 0.92rem;
  }
  .innen {
    max-width: var(--rl-container);
    margin: 0 auto;
    padding: 0 24px;
  }
  .marke {
    font-family: var(--schrift-ueber);
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--rl-weiss);
    margin: 0 0 12px;
  }
  .marke span {
    background: linear-gradient(135deg, var(--relilab) 0%, #f28ffb 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .text {
    max-width: 60ch;
    margin: 0;
  }
  .werkzeug {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
    margin-top: 28px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.14);
    font-family: var(--schrift-label);
    font-size: 0.86rem;
  }
  .schalter {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: var(--rl-weiss);
  }
  .schalter input {
    accent-color: var(--relilab);
  }
  .erklaerung {
    font-size: 0.8rem;
  }
</style>
