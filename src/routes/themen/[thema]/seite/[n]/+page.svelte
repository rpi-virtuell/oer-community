<script>
  import Uebersicht from '$lib/komponenten/Uebersicht.svelte';
  import { kanonisch } from '$lib/routen/struktur.js';
  let { data } = $props();
</script>
<svelte:head>
  <title>{data.ueberschrift} · {data.struktur.wortmarke}</title>
  <link rel="canonical" href={kanonisch(data.struktur.basisUrl, `${data.basis}/seite/${data.seite}`)} />
</svelte:head>
<Uebersicht karten={data.karten} seite={data.seite} seiten={data.seiten} basis={data.basis} ueberschrift={data.ueberschrift} hinweis={data.hinweis} />
