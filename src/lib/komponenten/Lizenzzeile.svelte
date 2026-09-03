<script>
  /** @type {{ nachweis: import('$lib/models/lizenz.js').Nachweis }} */
  let { nachweis } = $props();
</script>

<!-- Nur der Inhalt der Bildunterschrift; das <figcaption> setzt der
     Bildbereich, damit es unmittelbares Kind von <figure> bleibt (a11y). -->
{#if nachweis.titel}<span>{nachweis.titel} — </span>{/if}
<span>{nachweis.credit}</span>,
<a href={nachweis.license} rel="license noopener" target="_blank">Lizenz</a>
