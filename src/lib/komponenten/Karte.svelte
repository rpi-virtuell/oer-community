<script>
  import Lizenzpille from './Lizenzpille.svelte';
  /**
   * Eine Übersichtskarte. Als `aufmacher` liegt sie zweispaltig quer über
   * dem Raster — Cover links, Text rechts, größere Überschrift (ADR-0040).
   * @type {{ karte: import('$lib/loaders/uebersicht.js').Karte, aufmacher?: boolean }}
   */
  let { karte, aufmacher = false } = $props();
  const datum = $derived(new Date(karte.veroeffentlicht).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }));
</script>

<article class={aufmacher ? 'karte aufmacher' : 'karte'}>
  {#if karte.cover}
    <!-- Cover mit Lizenzstand als Pille (ADR-0032). Der Bild-Link ist
         aria-hidden (der Titel darunter ist der Link); die Pille steht deshalb
         neben ihm, nicht darin. Die verlinkte Attribution steht auf der
         Artikelseite. -->
    <div class="cover">
      <a href={karte.pfad} tabindex="-1" aria-hidden="true">
        <img src={karte.cover.url} alt={karte.cover.alt} loading="lazy" />
      </a>
      <Lizenzpille lizenz={karte.cover.lizenz} />
    </div>
  {:else}
    <!-- Ohne zeigbares Cover hält ein leeres Rasterfeld die Zeile: das
         behauptet kein Bild, es hält nur den Platz. -->
    <div class="cover leer" aria-hidden="true"></div>
  {/if}
  <div class="text">
    <p class="label"><time datetime={karte.veroeffentlicht}>{datum}</time></p>
    <h2 class:display={aufmacher}><a href={karte.pfad}>{karte.titel}</a></h2>
    {#if karte.zusammenfassung}<p class="anriss">{karte.zusammenfassung}</p>{/if}
    {#if karte.themen.length > 0}
      <ul class="metazeile themen">
        {#each karte.themen as thema (thema.slug)}
          <li><a class="marker" href={`/themen/${thema.slug}`}>{thema.name}</a></li>
        {/each}
      </ul>
    {/if}
  </div>
</article>

<style>
  .karte {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid var(--fb-rahmen);
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--fb-weiss);
    transition: transform var(--uebergang), border-color var(--uebergang);
  }
  .karte:hover {
    transform: translateY(-2px);
    border-color: var(--fb-primaer);
  }
  .cover {
    position: relative;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    border-bottom: 1px solid var(--fb-rahmen);
    background: var(--fb-flaeche);
  }
  .cover a { display: block; height: 100%; }
  .cover img {
    display: block;
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  /* Feines Raster wie im Panel, nur hell — der Platzhalter ohne Cover. */
  .cover.leer {
    aspect-ratio: 16 / 5;
    background:
      repeating-linear-gradient(0deg, transparent, transparent 32px, color-mix(in srgb, var(--fb-primaer) 5%, transparent) 32px, color-mix(in srgb, var(--fb-primaer) 5%, transparent) 33px),
      repeating-linear-gradient(90deg, transparent, transparent 32px, color-mix(in srgb, var(--fb-primaer) 5%, transparent) 32px, color-mix(in srgb, var(--fb-primaer) 5%, transparent) 33px),
      linear-gradient(135deg, var(--fb-flaeche) 0%, var(--fb-flaeche-2) 100%);
  }
  .text {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 20px 22px 18px;
  }
  .label { margin-bottom: 10px; }
  h2 {
    font-size: 1.35rem;
    line-height: 1.15;
    margin-bottom: 8px;
  }
  h2 a { color: inherit; text-decoration: none; }
  h2 a:hover { text-decoration: underline; text-decoration-color: var(--fb-akzent); text-underline-offset: 0.15em; }
  .anriss {
    margin: 0 0 14px;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--fb-text-leise);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  /* margin-top: auto drückt die Themen an den Kartenboden — nicht flex: 1 am
     Anriss, das streckte die Box und hob die Zeilenbegrenzung auf. */
  .themen {
    list-style: none;
    padding: 12px 0 0;
    margin: auto 0 0;
    border-top: 1px solid var(--fb-rahmen);
    gap: 6px;
  }
  .marker { text-decoration: none; }

  /* Aufmacher: quer, Cover links, Text rechts. */
  .aufmacher {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    height: auto;
  }
  .aufmacher .cover {
    aspect-ratio: auto;
    min-height: 360px;
    height: 100%;
    border-bottom: none;
    border-right: 1px solid var(--fb-rahmen);
  }
  .aufmacher .text {
    padding: 40px 44px;
    justify-content: center;
  }
  .aufmacher h2 {
    font-size: clamp(1.8rem, 3.2vw, 2.8rem);
    margin-bottom: 16px;
  }
  .aufmacher .anriss {
    font-size: 1.05rem;
    line-height: 1.55;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    margin-bottom: 22px;
  }
  @media (max-width: 1024px) {
    .aufmacher { grid-template-columns: 1fr; }
    .aufmacher .cover { aspect-ratio: 16 / 9; min-height: 0; border-right: none; border-bottom: 1px solid var(--fb-rahmen); }
    .aufmacher .text { padding: 28px; }
  }
</style>
