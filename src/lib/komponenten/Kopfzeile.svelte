<!--
  Kopfzeile: Wortmarke und Navigation zu Ansichten, die es gibt.

  Navigation nur zu Ansichten, die es gibt: Blog und Themen. Das Menü aus
  kind:30004 folgt in Stufe 2 (ADR-0027). Nicht sticky: Auf einer Leseseite
  frisst ein klebender Balken von 120px nur Platz; das Mockup klebt wegen der
  Navigation, die nötig ist.
-->

<header class="kopf">
  <div class="innen">
    <!-- Wortmarke vorläufig, bis es ein Branding gibt (ADR-0019). -->
    <a href="/" class="marke" aria-label="Community-Hub — zur Startseite">Community-<span>Hub</span></a>
    <nav aria-label="Hauptnavigation" class="nav">
      <a href="/blog">Blog</a>
      <a href="/themen">Themen</a>
    </nav>
  </div>
</header>

<style>
  .kopf {
    height: var(--rl-kopf);
    background: var(--rl-weiss);
    border-bottom: 1px solid var(--rl-linie);
  }
  .innen {
    max-width: var(--rl-container);
    height: 100%;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .nav {
    display: flex;
    gap: 20px;
    font-family: var(--schrift-label);
    font-weight: 500;
  }
  .nav a {
    color: var(--rl-dunkel);
    text-decoration: none;
  }
  .nav a:hover {
    text-decoration: underline;
  }
  .marke {
    font-family: var(--schrift-ueber);
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--rl-dunkel);
    text-decoration: none;
  }
  .marke:hover {
    color: var(--rl-dunkel);
  }
  .marke span {
    background: var(--verlauf);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  @media (max-width: 640px) {
    .kopf {
      height: auto;
    }
    .innen {
      padding: 16px 24px;
    }
  }
</style>
