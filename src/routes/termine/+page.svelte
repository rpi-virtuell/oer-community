<script>
  import Termine from '$lib/komponenten/Termine.svelte';
  import { kanonisch } from '$lib/kanonisch.js';
  let { data } = $props();
</script>
<svelte:head>
  <title>{data.ueberschrift} · {data.struktur.wortmarke}</title>
  <link rel="canonical" href={kanonisch(data.struktur.basisUrl, data.basis)} />
</svelte:head>
<Termine kommend={data.kommend} vergangen={data.vergangen} ueberschrift={data.ueberschrift} hinweis={data.hinweis} />
