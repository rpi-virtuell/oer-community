<script>
  import Termin from './Termin.svelte';
  import { t } from '$lib/sprache.js';

  /**
   * Die Terminliste: kommend zuerst, vergangenes darunter (ADR-0034). Der
   * Kartentyp steht in Termin.svelte; hier reicht die Durchreiche.
   *
   * @type {{
   *   kommend: import('./Termin.svelte').TerminkarteProp[],
   *   vergangen: import('./Termin.svelte').TerminkarteProp[],
   *   ueberschrift: string,
   *   hinweis?: string|null,
   *   sprache?: 'de'|'en'
   * }}
   */
  let { kommend, vergangen, ueberschrift, hinweis = null, sprache = 'de' } = $props();
</script>

<header class="detail-kopf">
  <h1>{ueberschrift}</h1>
</header>

{#if hinweis}
  <p class="hinweis">{hinweis}</p>
{/if}

{#each kommend as karte (karte.termin.d)}
  <Termin {karte} {sprache} />
{/each}

{#if vergangen.length > 0}
  <h2 class="vergangen">{t(sprache, 'vergangen')}</h2>
  {#each vergangen as karte (karte.termin.d)}
    <Termin {karte} {sprache} />
  {/each}
{/if}

<style>
  .detail-kopf {
    padding-bottom: 28px;
    border-bottom: 1px solid var(--fb-rahmen);
    margin-bottom: 32px;
  }
  .vergangen { margin: 40px 0 20px; }
</style>
