<script>
  import { startPfad, t } from '$lib/sprache.js';

  /**
   * Kopfzeile: Logo und Wortmarke aus kind:0, Menü aus kind:30004 plus die
   * Ansichten des Hubs (ADR-0027). Nichts hier ist hart verdrahtet außer dem
   * Link auf die Startseite der Sprache — der gehört dem Logo. Der aktuelle
   * Pfad kommt als Prop, weil Komponenten unter src/lib nichts aus $app
   * importieren (ADR-0014).
   *
   * @type {{ wortmarke: string, logoUrl?: string|null,
   *   menue: import('$lib/loaders/struktur.js').Eintrag[], aktuellerPfad?: string,
   *   sprache?: 'de'|'en', zweisprachig?: boolean, wechselPfad?: string }}
   */
  let {
    wortmarke,
    logoUrl = null,
    menue,
    aktuellerPfad = '/',
    sprache = 'de',
    zweisprachig = false,
    wechselPfad = '/'
  } = $props();
  /** @param {string} pfad */
  const aktuell = (pfad) => aktuellerPfad === pfad || aktuellerPfad.startsWith(`${pfad}/`);
</script>

<!-- Feed-Hinweis (ADR-0029): steht hier statt in +layout.svelte, weil das
     Layout mit seinem children-Snippet nicht über svelte/server zu testen
     ist — Kopfzeile ist auf jeder Seite eingebunden und deshalb gleichwertig. -->
<svelte:head>
  <link rel="alternate" type="application/rss+xml" title="{wortmarke} — {t(sprache, 'blog')}" href="/feed.xml" />
</svelte:head>

<header class="kopf">
  <div class="innen">
    <a href={startPfad(sprache)} class="marke" aria-label="{wortmarke} — {t(sprache, 'zurStartseite')}">
      {#if logoUrl}<img src={logoUrl} alt="" class="logo" />{/if}
      <span>{wortmarke}</span>
    </a>
    <nav aria-label={t(sprache, 'hauptnavigation')} class="nav">
      {#each menue as eintrag (eintrag.pfad)}
        <a href={eintrag.pfad} aria-current={aktuell(eintrag.pfad) ? 'page' : undefined}
          >{eintrag.titel}</a
        >
      {/each}
    </nav>
    {#if zweisprachig}
      <!-- Umschalter (ADR-0033): die aktuelle Sprache ist Text, die andere ein Link
           auf das Gegenstück oder die Startseite der Sprache. -->
      <nav aria-label={t(sprache, 'sprache')} class="sprachen">
        {#if sprache === 'de'}<span aria-current="true" lang="de">DE</span>{:else}<a
            href={wechselPfad}
            hreflang="de"
            lang="de">DE</a
          >{/if}
        <span aria-hidden="true">|</span>
        {#if sprache === 'en'}<span aria-current="true" lang="en">EN</span>{:else}<a
            href={wechselPfad}
            hreflang="en"
            lang="en">EN</a
          >{/if}
      </nav>
    {/if}
  </div>
</header>

<style>
  /* Klebend und halbtransparent mit Blur (ADR-0035); der orange Saum bleibt
     die Marke. Ohne color-mix bleibt die Fläche deckend statt unsichtbar. */
  .kopf {
    position: sticky;
    top: 0;
    z-index: 50;
    min-height: var(--hoehe-kopf);
    background: var(--fb-flaeche-2);
    background: color-mix(in srgb, var(--fb-flaeche-2) 88%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--fb-akzent);
  }
  .innen {
    max-width: var(--breite-container);
    min-height: var(--hoehe-kopf);
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px 32px;
  }
  .nav {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 28px;
    font-family: var(--schrift);
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .nav a {
    color: var(--fb-text);
    text-decoration: none;
    padding: 4px 0;
    border-bottom: 2px solid transparent;
    transition: color var(--uebergang), border-color var(--uebergang);
  }
  .nav a:hover {
    color: var(--fb-primaer);
    text-decoration: none;
  }
  .nav a[aria-current] {
    color: var(--fb-ueberschrift);
    border-bottom-color: var(--fb-akzent);
  }
  .sprachen {
    display: flex;
    gap: 8px;
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    color: var(--fb-text-leise);
  }
  .sprachen a {
    color: var(--fb-primaer);
    text-decoration: none;
  }
  .sprachen a:hover {
    text-decoration: underline;
    color: var(--fb-ueberschrift);
  }
  .sprachen [aria-current] {
    font-weight: 700;
    color: var(--fb-ueberschrift);
  }
  .marke {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: var(--schrift);
    font-size: 1.45rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--fb-ueberschrift);
    text-decoration: none;
  }
  .marke:hover {
    color: var(--fb-ueberschrift);
    text-decoration: none;
  }
  .logo {
    height: 40px;
    width: auto;
  }
  @media (max-width: 640px) {
    .kopf {
      position: static;
    }
    .innen {
      padding: 14px 24px;
    }
    .marke {
      font-size: 1.2rem;
    }
  }
</style>
