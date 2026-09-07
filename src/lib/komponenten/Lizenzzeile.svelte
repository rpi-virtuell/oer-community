<script>
  import { attributionsGlieder } from '$lib/attribution.js';

  /** @type {{ nachweis: import('$lib/models/lizenz.js').Nachweis }} */
  let { nachweis } = $props();

  const glieder = $derived(attributionsGlieder(nachweis));
</script>

<!-- Bildattribution nach bildattribution.md (ADR-0022, Punkt 4):
       [title](sourceUrl), [author](authorUrl), [licence](licenceUrl), modification
     Reihenfolge normativ, Trenner ", ", keine Wörter. Nur der Inhalt; das
     <figcaption> setzt der Bildbereich, damit es unmittelbares Kind von
     <figure> bleibt (a11y). -->
{#if glieder}
  {#each glieder as g, i (g.art)}{#if i > 0}, {/if}{#if g.href}<a
        href={g.href}
        rel={g.art === 'lizenz' ? 'license noopener' : 'noopener'}
        target="_blank">{g.text}</a
      >{:else}<span>{g.text}</span>{/if}{/each}
{/if}
