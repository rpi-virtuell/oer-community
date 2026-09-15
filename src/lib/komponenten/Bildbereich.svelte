<script>
  import { GRUND_TEXT, NICHT_ZEIGBAR } from '$lib/models/lizenz.js';
  import Lizenzzeile from './Lizenzzeile.svelte';
  import Lizenzpille from './Lizenzpille.svelte';
  import { t } from '$lib/sprache.js';

  /**
   * Eine Bildfigur mit Lizenzstand — für das Cover wie für Bilder im Text
   * (ADR-0022, ADR-0023). `altVorrang` ist der Alt-Text an dieser Verwendung
   * (Markdown), `unterschrift` die Zeile der Autor:in unter dem Bild, bereits
   * entschärft — sie erscheint nur, wenn kein Nachweis aufgelöst ist.
   *
   * @type {{
   *   lizenz: import('$lib/models/lizenz.js').Ergebnis,
   *   titel: string,
   *   bildUrl?: string|null,
   *   altVorrang?: string|null,
   *   unterschrift?: string|null,
   *   sprache?: 'de'|'en'
   * }}
   */
  let {
    lizenz,
    titel,
    bildUrl = null,
    altVorrang = null,
    unterschrift = null,
    sprache = 'de'
  } = $props();

  // Seit ADR-0022 wird das Bild auch ohne auflösbaren Nachweis ausgeliefert;
  // der Lizenzstand steht daran. Bei Erfolg kommt die Adresse aus dem
  // Nachweis, sonst vom Artikel — dann gibt es keinen geprüften url-Tag.
  const quelle = $derived(lizenz.ok ? lizenz.nachweis.url : bildUrl);

  // Was sich nicht zeigen lässt, steht im Modell (NICHT_ZEIGBAR) — dieselbe
  // Liste wie im Übersichts-Loader (ADR-0032).
  const zeigbar = $derived(Boolean(quelle) && (lizenz.ok || !NICHT_ZEIGBAR.includes(lizenz.grund)));

  // Alt-Text: die Angabe an dieser Verwendung zuerst — sie beschreibt, was
  // das Bild *hier* zeigt —, dann das alt-Tag des Nachweises, dann dessen
  // Titel, zuletzt der Artikeltitel. Ein Werktitel beschreibt nichts; er ist
  // nur besser als gar nichts.
  const alt = $derived(
    altVorrang?.trim() ||
      (lizenz.ok ? (lizenz.nachweis.alt ?? lizenz.nachweis.titel ?? titel) : titel)
  );
</script>

{#if zeigbar && quelle}
  <!-- Redaktionelle Bilder liegen auf Blossom in voller Größe (ADR-0010):
       volle Breite ist richtig. -->
  <figure class="bild">
    <div class="rahmen">
      <img src={quelle} {alt} />
      <Lizenzpille {lizenz} {sprache} />
    </div>
    <figcaption class="metazeile">
      {#if lizenz.ok}
        <Lizenzzeile nachweis={lizenz.nachweis} />
      {:else}
        <span class="ohne-nachweis">
          <strong>{t(sprache, 'lizenzUngeklaert')}.</strong>
          {GRUND_TEXT[lizenz.grund]}
        </span>
        {#if unterschrift}
          <!-- Die Angabe der Autor:in aus dem Markdown: Rückfall, nicht
               Wahrheit (ADR-0023). Ist der Nachweis da, ersetzt er sie. -->
          <span class="unterschrift">{@html unterschrift}</span>
        {/if}
      {/if}
    </figcaption>
  </figure>
{:else if lizenz.ok === false && (lizenz.grund === 'relativ' || lizenz.grund === 'abgeloester-host')}
  <p class="hinweis">
    <strong>{t(sprache, 'bildNichtAngezeigt')}</strong>
    {GRUND_TEXT[lizenz.grund]}
  </p>
{/if}

<style>
  .bild {
    margin: 0 0 32px;
  }
  .rahmen {
    position: relative;
  }
  .bild img {
    display: block;
    width: 100%;
    height: auto;
    border: 1px solid var(--fb-akzent);
    border-radius: var(--radius);
  }
  .bild figcaption {
    margin-top: 10px;
    display: block;
  }
  /* Der ungeklärte Fall wird ausgewiesen, nicht versteckt — aber er soll
     die Bildunterschrift des geklärten Falls nicht überschreien. */
  .ohne-nachweis {
    display: inline-block;
  }
  .unterschrift {
    display: block;
    margin-top: 4px;
  }
</style>
