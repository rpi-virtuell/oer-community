<script>
  import '../app.css';

  import Fusszeile from '$lib/komponenten/Fusszeile.svelte';

  let { children } = $props();
</script>

<div class="mx-auto max-w-3xl px-4 py-8">
  {@render children()}
  <Fusszeile />
</div>
