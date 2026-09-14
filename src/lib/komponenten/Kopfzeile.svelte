<script>
  /**
   * Kopfzeile: Logo und Wortmarke aus kind:0, Menü aus kind:30004 plus die
   * Ansichten des Hubs (ADR-0027). Nichts hier ist hart verdrahtet außer dem
   * Link auf / — der gehört dem Logo. Der aktuelle Pfad kommt als Prop, weil
   * Komponenten unter src/lib nichts aus $app importieren (ADR-0014).
   *
   * @type {{ wortmarke: string, logoUrl?: string|null,
   *   menue: import('$lib/loaders/struktur.js').Eintrag[], aktuellerPfad?: string }}
   */
  let { wortmarke, logoUrl = null, menue, aktuellerPfad = '/' } = $props();
  /** @param {string} pfad */
  const aktuell = (pfad) => aktuellerPfad === pfad || aktuellerPfad.startsWith(`${pfad}/`);
</script>

<header class="kopf">
  <div class="innen">
    <a href="/" class="marke" aria-label="{wortmarke} — zur Startseite">
      {#if logoUrl}<img src={logoUrl} alt="" class="logo" />{/if}
      <span>{wortmarke}</span>
    </a>
    <nav aria-label="Hauptnavigation" class="nav">
      {#each menue as eintrag (eintrag.pfad)}
        <a href={eintrag.pfad} aria-current={aktuell(eintrag.pfad) ? 'page' : undefined}
          >{eintrag.titel}</a
        >
      {/each}
    </nav>
  </div>
</header>

<style>
  .kopf {
    height: var(--hoehe-kopf);
    background: var(--fb-flaeche-2);
    border-bottom: 1px solid var(--fb-akzent);
  }
  .innen {
    max-width: var(--breite-container);
    height: 100%;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .nav {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    font-family: var(--schrift);
    font-weight: 500;
  }
  .nav a {
    color: var(--fb-primaer);
    text-decoration: none;
  }
  .nav a:hover,
  .nav a[aria-current] {
    text-decoration: underline;
    text-underline-offset: 0.3em;
    color: var(--fb-ueberschrift);
  }
  .marke {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: var(--schrift);
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--fb-ueberschrift);
    text-decoration: none;
  }
  .marke:hover {
    color: var(--fb-ueberschrift);
  }
  .logo {
    height: 48px;
    width: auto;
  }
  @media (max-width: 640px) {
    .kopf {
      height: auto;
    }
    .innen {
      padding: 16px 24px;
    }
  }
</style>
