<script>
  import { page } from '$app/state';

  const wortmarke = $derived(page.data?.struktur?.wortmarke ?? 'Community-Hub');
</script>

<svelte:head>
  <title>Fehler {page.status} · {wortmarke}</title>
</svelte:head>

<header class="detail-kopf">
  <p class="augenbraue">Fehler {page.status}</p>
  <h1>Das hat nicht geklappt</h1>
</header>
<p class="meldung">{page.error?.message}</p>

<style>
  .detail-kopf {
    padding-bottom: 28px;
    border-bottom: 1px solid var(--fb-rahmen);
    margin-bottom: 32px;
  }
  .detail-kopf h1 {
    margin-bottom: 0;
  }
  .meldung {
    font-size: 1.02rem;
  }
  .augenbraue {
    color: var(--fb-fehler);
  }
</style>
