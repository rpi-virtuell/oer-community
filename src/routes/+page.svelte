<script>
  import Detail from '$lib/komponenten/Detail.svelte';
  import NaechsteTermine from '$lib/komponenten/NaechsteTermine.svelte';
  import Startkopf from '$lib/komponenten/Startkopf.svelte';
  import Uebersicht from '$lib/komponenten/Uebersicht.svelte';
  import { kanonisch } from '$lib/kanonisch.js';
  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
</script>

<svelte:head>
  {#if data.art !== 'seite'}
    <title>{data.struktur.wortmarke}</title>
    <!-- / ist immer die Basis, unabhängig vom Zweig: /startseite leitet
         hierher (ADR-0029) — data.seite.pfad wäre der falsche Kanon. -->
    <link rel="canonical" href={kanonisch(data.struktur.basisUrl, '/')} />
  {/if}
</svelte:head>

{#if data.art === 'seite'}
  <!-- Hero mit Titel und Vorspann der Startseite (ADR-0035); der Inhalt
       darunter bleibt in der Lesebreite. -->
  <Startkopf titel={data.seite.artikel.titel} vorspann={data.seite.artikel.zusammenfassung} />
  <div class="lesebreite">
    <Detail
      data={data.seite}
      wortmarke={data.struktur.wortmarke}
      nurWortmarke
      ohneKopf
      kanonischeUrl={kanonisch(data.struktur.basisUrl, '/')}
      basisUrl={data.struktur.basisUrl}
    />
  </div>
{:else}
  <Uebersicht karten={data.karten} seite={data.seitennummer} seiten={data.seiten} basis={data.basis} ueberschrift={data.ueberschrift} hinweis={data.hinweis} />
{/if}

<!-- Die nächsten Termine unter dem Inhalt, in beiden Zweigen (ADR-0034);
     ohne Termine rendert der Block nichts. -->
<NaechsteTermine karten={data.naechste} sprache={data.struktur.sprache} />
