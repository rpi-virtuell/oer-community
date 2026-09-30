<script>
  /**
   * Ein Fremdbild im Text (ADR-0038): hashlos, von einer fremden Website
   * eingebettet — typisch das Logo einer Partnerinstitution. Es gibt keinen
   * kind:1063; Rechtehinweis und Quellverweis stehen in der Zeile der
   * Autor:in darunter, bereits entschärft (inhalt.js). Ohne diese Zeile
   * wäre das Bild gar nicht erst ein Fremdbild-Teil geworden.
   *
   * Nicht volle Breite wie bei Blossom-Bildern (ADR-0010): Logos sind klein
   * und würden hochskaliert unscharf.
   *
   * @type {{ url: string, alt: string, unterschrift: string }}
   */
  let { url, alt, unterschrift } = $props();
</script>

<figure class="fremdbild">
  <img src={url} {alt} loading="lazy" referrerpolicy="no-referrer" />
  <figcaption class="metazeile">
    <!-- Gesäubert in inhalt.js — deshalb erlaubt in {@html}. -->
    <span class="unterschrift">{@html unterschrift}</span>
  </figcaption>
</figure>

<style>
  .fremdbild {
    margin: 0 0 32px;
  }
  .fremdbild img {
    display: block;
    max-width: min(100%, 320px);
    max-height: 120px;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  .fremdbild figcaption {
    margin-top: 8px;
    display: block;
  }
</style>
