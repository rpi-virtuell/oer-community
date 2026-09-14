<script>
  import { kanonisch } from '$lib/routen/struktur.js';
  let { data } = $props();
</script>
<svelte:head>
  <title>Themen · {data.struktur.wortmarke}</title>
  <link rel="canonical" href={kanonisch(data.struktur.basisUrl, '/themen')} />
</svelte:head>
<header class="detail-kopf"><h1>Themen</h1></header>
<ul class="themenliste">
  {#each data.themen as t (t.slug)}
    <li><a href={`/themen/${t.slug}`}>{t.name}</a> <span class="metazeile">{t.anzahl}</span></li>
  {/each}
</ul>
<style>
  .themenliste { list-style: none; padding: 0; columns: 2 18rem; column-gap: 32px; }
  .themenliste li { break-inside: avoid; padding: 6px 0; display: flex; gap: 10px; align-items: baseline; }
</style>
