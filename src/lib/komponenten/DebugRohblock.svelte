<script>
  /**
   * Ein JSON-Block mit Kopier- und Ausklappknopf.
   *
   * Nach dem Vorbild von edufeeds „Component Event Object": zugeklappt eine
   * Vorschau, ausgeklappt mehr Höhe, beides scrollbar.
   *
   * @type {{ titel: string, daten: unknown }}
   */
  let { titel, daten } = $props();

  let offen = $state(false);
  let kopiert = $state(false);
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let uhr;

  const text = $derived(JSON.stringify(daten, null, 2));

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(text);
      kopiert = true;
      clearTimeout(uhr);
      uhr = setTimeout(() => (kopiert = false), 1500);
    } catch {
      // Ohne Zwischenablage bleibt der Text markierbar.
    }
  }
</script>

<div class="kopf">
  <h4 style="color: var(--fb-text)">{titel}</h4>
  <span class="knoepfe">
    <button type="button" onclick={kopieren} style="color: var(--fb-text-leise)">
      {kopiert ? 'kopiert' : 'kopieren'}
    </button>
    <button
      type="button"
      onclick={() => (offen = !offen)}
      aria-expanded={offen}
      style="color: var(--fb-text-leise)"
    >
      {offen ? 'einklappen' : 'ausklappen'}
    </button>
  </span>
</div>

<div
  class="block"
  class:offen
  style="background: var(--fb-weiss); border-color: var(--fb-rahmen)"
>
  <pre style="color: var(--fb-text)">{text}</pre>
</div>

<style>
  .kopf {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.375rem;
  }
  h4 {
    font-size: 0.86rem;
    font-weight: 700;
  }
  .knoepfe {
    display: flex;
    gap: 0.75rem;
    flex: none;
  }
  .knoepfe button {
    font-size: 0.78rem;
    cursor: pointer;
    text-decoration: underline;
  }
  .knoepfe button:hover {
    color: var(--fb-text);
  }
  .block {
    border-width: 1px;
    border-style: solid;
    border-radius: 0.375rem;
    padding: 0.5rem 0.625rem;
    max-height: 5.5rem;
    overflow: auto;
    transition: max-height 0.2s;
  }
  .block.offen {
    max-height: 26rem;
  }
  pre {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.76rem;
    line-height: 1.5;
  }
</style>
