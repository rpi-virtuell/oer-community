<script>
  /**
   * Fußzeile mit dem Debug-Schalter.
   *
   * Der Schalter liegt hier und nicht auf einer Einstellungsseite: Eine
   * solche wäre Verwaltung und damit ausserhalb des Zuschnitts (CLAUDE.md).
   * Die edufeed-app hat ihn unter „Entwickler-Einstellungen" in /settings —
   * dieselbe Mechanik (Rune plus localStorage), nur ein anderer Ort.
   */
  import { onMount } from 'svelte';

  import { einstellungen } from '$lib/einstellungen.svelte.js';

  // Erst im Browser: Der Server kennt localStorage nicht, und ein
  // abweichender Startwert wäre ein Unterschied zur Serverdarstellung.
  onMount(() => einstellungen.ausSpeicherLaden());
</script>

<footer class="fuss" style="border-color: var(--rl-linie); color: var(--rl-text-leise)">
  <label class="schalter">
    <input
      type="checkbox"
      checked={einstellungen.debugModus}
      onchange={() => einstellungen.debugModusUmschalten()}
    />
    <span>Debug-Modus</span>
  </label>
  <span class="erklaerung">
    zeigt die Rohdaten von Beitrag und Lizenznachweis an
  </span>
</footer>

<style>
  .fuss {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
    margin-top: 4rem;
    border-top-width: 1px;
    border-top-style: solid;
    padding-top: 1rem;
    font-size: 0.8rem;
  }
  .schalter {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  .erklaerung {
    font-size: 0.78rem;
  }
</style>
