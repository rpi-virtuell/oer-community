<script>
  import Detail from '$lib/komponenten/Detail.svelte';
  import NaechsteTermine from '$lib/komponenten/NaechsteTermine.svelte';
  import Startkopf from '$lib/komponenten/Startkopf.svelte';
  import { kanonisch } from '$lib/kanonisch.js';

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
</script>

<!-- /en ist die Basis der englischen Startseite (ADR-0033): /en/startseite
     leitet hierher, deshalb ist der Kanon /en und nicht data.pfad. -->
<Startkopf titel={data.artikel.titel} vorspann={data.artikel.zusammenfassung} />
<div class="lesebreite">
  <Detail
    {data}
    wortmarke={data.struktur.wortmarke}
    nurWortmarke
    ohneKopf
    kanonischeUrl={kanonisch(data.struktur.basisUrl, '/en')}
    basisUrl={data.struktur.basisUrl}
  />
</div>

<!-- Dieselben Termine wie unter / — den Kalender gibt es einmal (ADR-0034). -->
<NaechsteTermine karten={data.naechste} sprache={data.struktur.sprache} />
