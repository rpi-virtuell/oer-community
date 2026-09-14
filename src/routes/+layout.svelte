<script>
  import '../app.css';
  import { page } from '$app/state';

  import Kopfzeile from '$lib/komponenten/Kopfzeile.svelte';
  import Fusszeile from '$lib/komponenten/Fusszeile.svelte';

  /** @type {{ children: import('svelte').Snippet, data: import('./$types').LayoutData }} */
  let { children, data } = $props();
</script>

<Kopfzeile
  wortmarke={data.struktur.wortmarke}
  logoUrl={data.struktur.logoUrl}
  menue={data.struktur.menue}
  aktuellerPfad={page.url.pathname}
/>
<main class="schmal">
  {@render children()}
</main>
<Fusszeile
  wortmarke={data.struktur.wortmarke}
  fusstextHtml={data.struktur.fusstextHtml}
  links={data.struktur.fusszeilenLinks}
  befund={data.struktur.befund}
  spiegelstand={data.spiegelstand}
/>

<style>
  /* Textbreite „schmal" aus dem Designsystem: 820px. */
  .schmal {
    max-width: var(--breite-schmal);
    margin: 0 auto;
    padding: 40px 24px 0;
  }
</style>
