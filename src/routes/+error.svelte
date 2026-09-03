<script>
  import { page } from '$app/state';
</script>

<h1 class="text-2xl font-bold">Das hat nicht geklappt</h1>
<p class="mt-2 text-sm" style="color: var(--rl-text-leise)">Fehler {page.status}</p>
<p class="mt-4">{page.error?.message}</p>
