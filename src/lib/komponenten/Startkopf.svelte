<script>
  /**
   * Der Hero der Startseite (ADR-0035): links Titel und Vorspann der Seite
   * `d = startseite` aus Nostr, rechts das blaue Panel mit dem Logo aus
   * kind:0 — ohne Logo steht dort die Wortmarke. Kein Text hier ist
   * erfunden: Titel und Vorspann kommen aus dem Event, Logo und Wortmarke
   * aus dem Profil (ADR-0027).
   *
   * @type {{ titel: string, vorspann?: string|null, wortmarke: string, logoUrl?: string|null }}
   */
  let { titel, vorspann = null, wortmarke, logoUrl = null } = $props();
</script>

<section class="start" aria-labelledby="start-titel">
  <div class="text">
    <h1 id="start-titel" class="display">{titel}</h1>
    {#if vorspann}<p class="vorspann">{vorspann}</p>{/if}
  </div>
  <!-- Dekoration: Logo und Wortmarke stehen schon in der Kopfzeile. -->
  <div class="panel bild" aria-hidden="true">
    {#if logoUrl}
      <img src={logoUrl} alt="" class="logo" />
    {:else}
      <span class="display marke">{wortmarke}</span>
    {/if}
  </div>
</section>

<style>
  .start {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: 64px;
    align-items: center;
    margin-bottom: 56px;
  }
  .text h1 {
    font-size: clamp(2.6rem, 6vw, 5rem);
    margin-bottom: 28px;
  }
  .vorspann {
    font-size: 1.15rem;
    line-height: 1.55;
    color: var(--fb-text-leise);
    max-width: 34em;
    margin: 0;
  }
  .bild {
    aspect-ratio: 4 / 3;
    display: grid;
    place-items: center;
    padding: 12%;
    border: 1px solid var(--fb-rahmen);
  }
  /* Wie im Landing-Entwurf: das Logo als weiße Silhouette auf dem Blau. */
  .logo {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    filter: brightness(0) invert(1);
    transition: transform var(--uebergang);
  }
  .bild:hover .logo {
    transform: scale(1.02);
  }
  .marke {
    font-size: clamp(2rem, 5vw, 3.6rem);
    letter-spacing: 0.12em;
    text-align: center;
    overflow-wrap: anywhere;
  }
  @media (max-width: 1024px) {
    .start {
      grid-template-columns: 1fr;
      gap: 32px;
    }
    .bild {
      aspect-ratio: 16 / 9;
    }
  }
</style>
