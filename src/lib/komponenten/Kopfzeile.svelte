<!--
  Kopfzeile: nur die Wortmarke, verlinkt auf die Startseite.

  Keine Navigation — es gibt noch nichts, wohin man navigieren könnte, und
  was es nicht gibt, wird nicht angedeutet (CLAUDE.md). Nicht sticky: Auf
  einer Leseseite frisst ein klebender Balken von 120px nur Platz; das
  Mockup klebt wegen der Navigation, die hier fehlt.
-->

<header class="kopf">
  <div class="innen">
    <a href="/" class="marke" aria-label="relilab — zur Startseite">reli<span>lab</span></a>
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
