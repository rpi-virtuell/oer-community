<script>
  import { attributionsGlieder } from '$lib/attribution.js';
  import KiMarke from './KiMarke.svelte';

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
      >{:else if g.art === 'ki'}<KiMarke text={g.text} />{:else}<span>{g.text}</span>{/if}{/each}
{/if}
