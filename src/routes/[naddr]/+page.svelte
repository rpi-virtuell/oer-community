<script>
  import Bildbereich from '$lib/komponenten/Bildbereich.svelte';

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();

  // $derived, nicht const: data ist ein Prop und aendert sich bei Navigation.
  const datum = $derived(
    new Date(data.artikel.veroeffentlicht).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  );
</script>

<svelte:head>
  <title>{data.artikel.titel} — community-hub</title>
  <meta name="description" content={data.artikel.zusammenfassung} />
</svelte:head>

<article>
  <h1 class="text-3xl font-bold leading-tight">{data.artikel.titel}</h1>

  <p class="mt-2 text-sm" style="color: var(--rl-text-leise)">
    veröffentlicht am {datum}
  </p>

  {#if data.artikel.themen.length > 0}
    <ul class="mt-3 flex flex-wrap gap-2 text-xs">
      {#each data.artikel.themen as thema (thema)}
        <li class="rounded px-2 py-1" style="background: var(--rl-flaeche-2)">
          {thema}
        </li>
      {/each}
    </ul>
  {/if}

  <Bildbereich lizenz={data.lizenz} titel={data.artikel.titel} />

  {#if data.artikel.zusammenfassung}
    <p class="text-lg font-medium">{data.artikel.zusammenfassung}</p>
  {/if}

  <!-- Markdown aus dem Event; in inhalt.js gesäubert. -->
  <div class="inhalt mt-6">{@html data.html}</div>

  {#if data.entfernteBilder.length > 0}
    <p class="mt-8 text-sm" style="color: var(--rl-text-leise)">
      {data.entfernteBilder.length} Bildverweis{data.entfernteBilder.length === 1
        ? ''
        : 'e'} im Text
      {data.entfernteBilder.length === 1 ? 'wurde' : 'wurden'} nicht angezeigt:
      relative Pfade, die nur auf der alten Website auflösen.
    </p>
  {/if}
</article>

<style>
  .inhalt :global(h2) {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 0.5rem;
  }
  .inhalt :global(p) {
    margin-bottom: 1rem;
    line-height: 1.7;
  }
  .inhalt :global(ul) {
    list-style: disc;
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }
  .inhalt :global(li) {
    margin-bottom: 0.25rem;
  }
  .inhalt :global(blockquote) {
    border-left: 3px solid var(--rl-linie);
    padding-left: 1rem;
    font-style: italic;
    margin-bottom: 1rem;
  }
  .inhalt :global(img) {
    max-width: 100%;
    height: auto;
  }
</style>
