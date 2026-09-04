<script>
  import '../app.css';

  import Kopfzeile from '$lib/komponenten/Kopfzeile.svelte';
  import Fusszeile from '$lib/komponenten/Fusszeile.svelte';

  let { children } = $props();
</script>

<Kopfzeile />
<main class="schmal">
  {@render children()}
</main>
<Fusszeile />

<style>
  /* Textbreite „schmal" aus dem Designsystem: 820px. */
  .schmal {
    max-width: var(--rl-schmal);
    margin: 0 auto;
    padding: 40px 24px 0;
  }
</style>
