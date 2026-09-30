<script>
  import Themenwolke from '$lib/komponenten/Themenwolke.svelte';
  import { kanonisch } from '$lib/kanonisch.js';
  let { data } = $props();
</script>
<svelte:head>
  <title>Themen · {data.struktur.wortmarke}</title>
  <link rel="canonical" href={kanonisch(data.struktur.basisUrl, '/themen')} />
</svelte:head>
<header class="detail-kopf"><h1>Themen</h1></header>
<!-- Als Wolke nach Häufigkeit (ADR-0040); die Anzahl steht an jedem Thema. -->
<Themenwolke themen={data.themen} />
<style>
  .detail-kopf {
    padding-bottom: 24px;
    border-bottom: 1px solid var(--fb-rahmen);
    margin-bottom: 32px;
  }
</style>
