<script>
  /**
   * Eine Kachel: Label links, Wert rechts, optional ein Kopierknopf.
   *
   * Bei edufeed ist dieses Markup in jeder Feldzeile wiederholt
   * (`EventDebugInfo.svelte`, ~15 Mal). Hier steht es einmal — sonst wandert
   * jede Änderung an Abstand oder Kontrast durch ein Dutzend Stellen.
   *
   * @type {{
   *   label: string,
   *   wert?: string|number|null,
   *   kurz?: string,
   *   kopierbar?: boolean,
   *   einspaltig?: boolean
   * }}
   */
  let { label, wert = null, kurz = undefined, kopierbar = false, einspaltig = false } =
    $props();

  let kopiert = $state(false);
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let uhr;

  const angezeigt = $derived(kurz ?? (wert === null || wert === '' ? '—' : String(wert)));

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(String(wert));
      kopiert = true;
      clearTimeout(uhr);
      uhr = setTimeout(() => (kopiert = false), 1500);
    } catch {
      // Ohne Schreibrechte auf die Zwischenablage bleibt der Wert lesbar.
    }
  }
</script>

<div
  class="feld"
  class:einspaltig
  style="background: var(--fb-weiss); border-color: var(--fb-rahmen)"
>
  <span class="label" style="color: var(--fb-text-leise)">{label}</span>
  <span class="rechts">
    <code class="wert" title={kurz ? String(wert) : undefined}>{angezeigt}</code>
    {#if kopierbar && wert}
      <button
        type="button"
        class="knopf"
        onclick={kopieren}
        aria-label={kopiert ? `${label} kopiert` : `${label} kopieren`}
        style="color: var(--fb-text-leise)"
      >
        {#if kopiert}
          <!-- Haken -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        {:else}
          <!-- Zwei Blätter -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke-linecap="round" />
          </svg>
        {/if}
      </button>
    {/if}
  </span>
</div>

<style>
  .feld {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border-width: 1px;
    border-style: solid;
    border-radius: 0.375rem;
    padding: 0.5rem 0.625rem;
    min-width: 0;
  }
  .label {
    /* Roboto Condensed traegt Labels und Metazeilen (docs/designsystem.md). */
    font-size: 0.8rem;
    white-space: nowrap;
  }
  .rechts {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
  }
  .wert {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.78rem;
    overflow-x: auto;
    white-space: nowrap;
  }
  /* Volle Breite fuer lange Werte wie Zeitstempel oder Signaturen. */
  .einspaltig {
    grid-column: 1 / -1;
  }
  .knopf {
    flex: none;
    display: grid;
    place-items: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
  }
  .knopf:hover {
    background: var(--fb-flaeche-2);
    color: var(--fb-text);
  }
  .knopf svg {
    width: 0.85rem;
    height: 0.85rem;
  }
</style>
