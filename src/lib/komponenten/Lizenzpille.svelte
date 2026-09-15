<script>
  import { GRUND_TEXT } from '$lib/models/lizenz.js';
  import { KI_TEXT, attributionsGlieder } from '$lib/attribution.js';
  import { lizenzLabel } from '$lib/lizenzlabel.js';
  import KiMarke from './KiMarke.svelte';

  /**
   * Der Lizenzstand als Pille unten rechts auf dem Bild (ADR-0032) — Vorbild
   * ist edufeeds ImageLicenseOverlay: KI-Marke · Kürzel · Credit, sonst ein
   * neutraler Hinweis. Kein Link (die Pille liegt auf einem verlinkten Bild),
   * kein Popover (ohne JavaScript lesbar): die volle Attribution bzw. der
   * Grund stehen im title, ausführlich auf der Artikelseite.
   * Der Aufrufer setzt `position: relative` am Bildcontainer.
   * @type {{ lizenz: import('$lib/models/lizenz.js').Ergebnis }}
   */
  let { lizenz } = $props();

  const label = $derived(
    lizenz.ok ? lizenzLabel(lizenz.nachweis.license) || lizenz.nachweis.license : ''
  );
  const credit = $derived(lizenz.ok ? lizenz.nachweis.credit?.trim() || null : null);
  const ki = $derived(lizenz.ok && lizenz.nachweis.ki ? KI_TEXT[lizenz.nachweis.ki] : null);
  const titel = $derived(
    lizenz.ok
      ? (attributionsGlieder(lizenz.nachweis) ?? []).map((g) => g.text).join(', ')
      : `Lizenz ungeklärt. ${GRUND_TEXT[lizenz.grund]}`
  );
</script>

{#if lizenz.ok}
  <span class="pille bekannt" title={titel}>
    {#if ki}<KiMarke text={ki} /><span class="trenner" aria-hidden="true">·</span>{/if}
    <span class="lizenz">{label}</span>
    {#if credit}<span class="trenner" aria-hidden="true">·</span><span class="urheber">{credit}</span>{/if}
  </span>
{:else}
  <span class="pille ungeklaert" title={titel}>
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2" />
      <path d="M12 16v-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
      <circle cx="12" cy="8" r=".9" fill="currentColor" />
    </svg>
    Lizenz ungeklärt
  </span>
{/if}

<style>
  /* Grund: Weiß zu 90 % über dem Bild — trägt --fb-text auch über Schwarz
     (10,1:1, nachgerechnet in test/kontrast.test.js). */
  .pille {
    position: absolute;
    right: 8px;
    bottom: 8px;
    max-width: calc(100% - 16px);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 10px;
    border: 1px solid var(--fb-rahmen);
    border-radius: 999px;
    background: color-mix(in srgb, var(--fb-weiss) 90%, transparent);
    backdrop-filter: blur(4px);
    color: var(--fb-text);
    font-size: 0.78rem;
    line-height: 1.6;
    white-space: nowrap;
  }
  .lizenz {
    font-weight: 700;
  }
  .urheber {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .icon {
    width: 1em;
    height: 1em;
    flex: none;
  }
</style>
