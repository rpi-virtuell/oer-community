<script>
  import Detail from '$lib/komponenten/Detail.svelte';
  import { kanonisch } from '$lib/kanonisch.js';

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
</script>

<!-- /en ist die Basis der englischen Startseite (ADR-0033): /en/startseite
     leitet hierher, deshalb ist der Kanon /en und nicht data.pfad. -->
<Detail
  {data}
  wortmarke={data.struktur.wortmarke}
  nurWortmarke
  kanonischeUrl={kanonisch(data.struktur.basisUrl, '/en')}
  basisUrl={data.struktur.basisUrl}
/>
