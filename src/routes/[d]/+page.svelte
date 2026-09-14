<script>
  import Detail from '$lib/komponenten/Detail.svelte';

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
</script>

<Detail {data} wortmarke={data.struktur.wortmarke} />
