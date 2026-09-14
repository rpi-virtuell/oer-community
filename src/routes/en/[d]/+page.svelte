<script>
  import Detail from '$lib/komponenten/Detail.svelte';
  import { kanonisch } from '$lib/kanonisch.js';

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
</script>

<Detail {data} wortmarke={data.struktur.wortmarke} kanonischeUrl={kanonisch(data.struktur.basisUrl, data.pfad ?? '/')} />
