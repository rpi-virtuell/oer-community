<script>
  import Uebersicht from '$lib/komponenten/Uebersicht.svelte';
  let { data } = $props();
</script>
<svelte:head><title>{data.ueberschrift} · {data.struktur.wortmarke}</title></svelte:head>
<Uebersicht karten={data.karten} seite={data.seite} seiten={data.seiten} basis={data.basis} ueberschrift={data.ueberschrift} hinweis={data.hinweis} />
