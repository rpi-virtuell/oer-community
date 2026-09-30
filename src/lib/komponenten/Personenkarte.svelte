<script>
  import { t } from '$lib/sprache.js';

  /**
   * Eine Person aus dem Team, gebaut aus ihrem eigenen kind:0 (ADR-0039):
   * Porträt im festen Hochformat mit Akzentrahmen, Name, Selbstbeschreibung,
   * Kontakt — wie die Teamseite der alten Hugo-Seite.
   *
   * Das Porträt ist das Profilbild, das die Person selbst veröffentlicht; es
   * trägt keine Lizenzpille, so wenig wie das Logo in der Kopfzeile.
   *
   * @type {{
   *   person: { pubkey: string, name: string|null, bildUrl: string|null, aboutHtml: string,
   *     website: string|null, email: string|null, nip05: string|null },
   *   sprache: 'de'|'en'
   * }}
   */
  let { person, sprache } = $props();

  const kontakt = $derived(person.email || person.website);
</script>

<section class="person">
  {#if person.bildUrl}
    <img class="portraet" src={person.bildUrl} alt={person.name ?? ''} loading="lazy" />
  {/if}
  {#if person.name}
    <p class="name">{person.name}</p>
  {/if}
  {#if person.aboutHtml}
    <div class="about">{@html person.aboutHtml}</div>
  {/if}
  {#if kontakt}
    <p class="kontakt">
      {t(sprache, 'kontakt')}:
      {#if person.email}<a href={`mailto:${person.email}`}>{person.email}</a>{/if}
      {#if person.email && person.website}·{/if}
      {#if person.website}<a href={person.website} rel="noopener">{person.website.replace(/^https:\/\//, '').replace(/\/$/, '')}</a>{/if}
    </p>
  {/if}
</section>

<style>
  .person {
    margin: 1.6em 0 2.2em;
  }
  .portraet {
    display: block;
    width: 160px;
    height: 210px;
    object-fit: cover;
    border: 2px solid var(--fb-akzent);
    border-radius: var(--radius);
    margin: 0 0 1rem;
  }
  .name {
    font-weight: 700;
    color: var(--fb-ueberschrift);
    margin: 0 0 0.6rem;
  }
  .about :global(p) {
    margin: 0 0 0.8rem;
  }
  .kontakt {
    margin: 0;
  }
</style>
