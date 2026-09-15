<script>
  import Detail from '$lib/komponenten/Detail.svelte';
  import Uebersicht from '$lib/komponenten/Uebersicht.svelte';
  import { kanonisch } from '$lib/kanonisch.js';
  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
</script>

<svelte:head>
  {#if data.art !== 'seite'}
    <title>{data.struktur.wortmarke}</title>
    <!-- / ist immer die Basis, unabhängig vom Zweig: /startseite leitet
         hierher (ADR-0029) — data.seite.pfad wäre der falsche Kanon. -->
    <link rel="canonical" href={kanonisch(data.struktur.basisUrl, '/')} />
  {/if}
</svelte:head>

{#if data.art === 'seite'}
  <Detail
    data={data.seite}
    wortmarke={data.struktur.wortmarke}
    nurWortmarke
    kanonischeUrl={kanonisch(data.struktur.basisUrl, '/')}
    basisUrl={data.struktur.basisUrl}
  />
{:else}
  <Uebersicht karten={data.karten} seite={data.seitennummer} seiten={data.seiten} basis={data.basis} ueberschrift={data.ueberschrift} hinweis={data.hinweis} />
{/if}
