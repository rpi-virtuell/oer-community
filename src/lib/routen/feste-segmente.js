/**
 * Die festen Segmente der ersten Pfadebene (ADR-0029) für die Routen-Schicht.
 * Die Liste selbst steht in `src/lib/models/feste-segmente.js`, damit auch der
 * Loader sie lesen kann, ohne aus `routen/` zu importieren (ADR-0014); hier
 * steht nur der Re-Export, damit bestehende Aufrufer unverändert bleiben.
 */
export { FESTE_SEGMENTE } from '../models/feste-segmente.js';
