<script>
  import { GRUND_TEXT } from '$lib/models/lizenz.js';
  import Lizenzzeile from './Lizenzzeile.svelte';

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
   *   unterschrift?: string|null
   * }}
   */
  let { lizenz, titel, bildUrl = null, altVorrang = null, unterschrift = null } = $props();

  // Seit ADR-0022 wird das Bild auch ohne auflösbaren Nachweis ausgeliefert;
  // der Lizenzstand steht daran. Bei Erfolg kommt die Adresse aus dem
  // Nachweis, sonst vom Artikel — dann gibt es keinen geprüften url-Tag.
  const quelle = $derived(lizenz.ok ? lizenz.nachweis.url : bildUrl);

  // 'kein-bild', 'relativ' und 'abgeloester-host' liefern nichts Anzeigbares:
  // Im einen Fall gibt es keine Adresse, im zweiten nur eine, die gegen
  // WordPress auflösen würde (ADR-0013, Punkt 5), im dritten liegt das Bild
  // auf einem Host, den dieser Hub ablöst (ADR-0030).
  const NICHT_ZEIGBAR = ['kein-bild', 'relativ', 'abgeloester-host'];
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
       volle Breite ist richtig. Die 150px-Thumbnails des relilab-Altbestands
       wären ein anderer Fall — der ist hier noch nicht in Betrieb. -->
  <figure class="bild">
    <img src={quelle} {alt} />
    <figcaption class="metazeile">
      {#if lizenz.ok}
        <Lizenzzeile nachweis={lizenz.nachweis} />
      {:else}
        <span class="ohne-nachweis">
          <strong>Lizenz ungeklärt.</strong>
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
    <strong>Bild nicht angezeigt.</strong>
    {GRUND_TEXT[lizenz.grund]}
  </p>
{/if}

<style>
  .bild {
    margin: 0 0 32px;
  }
  .bild img {
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
