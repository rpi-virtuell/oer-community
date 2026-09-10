<script>
  import { attributionsGlieder } from '$lib/attribution.js';

  /** @type {{ nachweis: import('$lib/models/lizenz.js').Nachweis }} */
  let { nachweis } = $props();

  const glieder = $derived(attributionsGlieder(nachweis));
</script>

<!-- Bildattribution nach bildattribution.md (ADR-0022, Punkt 4):
       [title](sourceUrl), [author](authorUrl), [licence](licenceUrl), KI-Kennzeichnung, modification
     Reihenfolge normativ, Trenner ", ", keine Wörter. Die KI-Kennzeichnung
     (ADR-0025, ai-Tag) ist eine Marke direkt hinter der Lizenz. Nur der Inhalt; das
     <figcaption> setzt der Bildbereich, damit es unmittelbares Kind von
     <figure> bleibt (a11y). -->
{#if glieder}
  {#each glieder as g, i (g.art)}{#if i > 0}, {/if}{#if g.href}<a
        href={g.href}
        rel={g.art === 'lizenz' ? 'license noopener' : 'noopener'}
        target="_blank">{g.text}</a
      >{:else if g.art === 'ki'}<span
        class="ki"
        title="KI-Beteiligung laut Lizenznachweis (ai-Tag), Kennzeichnung nach EU AI Act"
        ><!-- Rundes „AI"-Label des EU AI Office, zur freien Nutzung ohne Namensnennung
             veröffentlicht; Pfade kopiert aus edufeeds AiLabelIcon.svelte (ADR-0025). --><svg
          class="ki-icon"
          viewBox="89 100 366 366"
          aria-hidden="true"
          focusable="false"
          ><circle cx="272.03" cy="283.47" r="182.74" fill="currentColor" /><g
            fill="var(--rl-weiss, #fff)"
            ><path
              d="M170.79,353.74c-1.08,0-2.05-.43-2.92-1.31-.88-.87-1.31-1.84-1.31-2.92,0-.67.07-1.27.2-1.81l47.34-129.32c.4-1.48,1.24-2.79,2.52-3.93,1.27-1.14,3.05-1.71,5.34-1.71h29.81c2.28,0,4.06.57,5.34,1.71,1.27,1.14,2.11,2.45,2.52,3.93l47.14,129.32c.27.54.4,1.14.4,1.81,0,1.08-.44,2.05-1.31,2.92s-1.91,1.31-3.12,1.31h-24.78c-2.01,0-3.52-.5-4.53-1.51-1.01-1.01-1.65-1.91-1.91-2.72l-7.86-20.55h-53.78l-7.65,20.55c-.27.81-.88,1.71-1.81,2.72-.94,1.01-2.55,1.51-4.83,1.51h-24.78ZM218.13,299.96h37.47l-18.93-53.18-18.53,53.18Z"
            /><path
              d="M328.11,353.74c-1.48,0-2.69-.47-3.63-1.41-.94-.94-1.41-2.15-1.41-3.63v-130.93c0-1.48.47-2.68,1.41-3.63s2.15-1.41,3.63-1.41h26.99c1.48,0,2.68.47,3.63,1.41.94.94,1.41,2.15,1.41,3.63v130.93c0,1.48-.47,2.69-1.41,3.63-.94.94-2.15,1.41-3.63,1.41h-26.99Z"
            /></g
          ></svg
        >{g.text}</span
      >{:else}<span>{g.text}</span>{/if}{/each}
{/if}

<style>
  /* Marke, kein Link: soll neben dem Lizenz-Link auffallen, ohne ihn zu überschreien. */
  .ki {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0 6px;
    border: 1px solid currentColor;
    border-radius: 4px;
    font-size: 0.85em;
    line-height: 1.5;
    white-space: nowrap;
  }
  .ki-icon {
    width: 1em;
    height: 1em;
    flex: none;
  }
</style>
