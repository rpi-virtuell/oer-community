<script>
  import Detail from '$lib/komponenten/Detail.svelte';
  import Uebersicht from '$lib/komponenten/Uebersicht.svelte';
  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
</script>

<svelte:head>
  {#if data.art !== 'seite'}
    <title>{data.struktur.wortmarke}</title>
  {/if}
</svelte:head>

{#if data.art === 'seite'}
  <Detail data={data.seite} wortmarke={data.struktur.wortmarke} nurWortmarke />
{:else}
  <Uebersicht karten={data.karten} seite={data.seitennummer} seiten={data.seiten} basis={data.basis} ueberschrift={data.ueberschrift} hinweis={data.hinweis} />
{/if}
