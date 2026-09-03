<script>
  import '../app.css';

  let { children } = $props();
</script>

<div class="mx-auto max-w-3xl px-4 py-8">
  {@render children()}
</div>
