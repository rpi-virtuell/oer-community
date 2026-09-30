<script>
  /**
   * Der Hero der Startseite (ADR-0040): Titel und Vorspann der Seite
   * `d = startseite` aus Nostr, groß gesetzt. Kein Logo und kein Panel —
   * Logo und Wortmarke stehen schon in der Kopfzeile, ein zweites Mal
   * daneben war Dekoration ohne Aussage. Kein Text hier ist erfunden.
   *
   * @type {{ titel: string, vorspann?: string|null }}
   */
  let { titel, vorspann = null } = $props();
</script>

<section class="start" aria-labelledby="start-titel">
  <h1 id="start-titel" class="display">{titel}</h1>
  {#if vorspann}<p class="vorspann">{vorspann}</p>{/if}
</section>

<style>
  .start {
    max-width: var(--breite-raster);
    margin: 24px 0 64px;
    padding-bottom: 40px;
    border-bottom: 1px solid var(--fb-rahmen);
  }
  .start h1 {
    font-size: clamp(2.6rem, 7vw, 5.6rem);
    margin-bottom: 24px;
    /* Orange Marke unter dem Titel — der Akzent als Linie, nie als Grund. */
    padding-bottom: 20px;
    border-bottom: 4px solid var(--fb-akzent);
    display: inline-block;
  }
  .vorspann {
    font-size: clamp(1.15rem, 1.8vw, 1.45rem);
    line-height: 1.5;
    color: var(--fb-text-leise);
    max-width: 38em;
    margin: 0;
  }
  @media (max-width: 640px) {
    .start { margin: 8px 0 40px; padding-bottom: 28px; }
  }
</style>
