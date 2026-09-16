/**
 * Größenstufe eines Themas in der Themenwolke (ADR-0035): fünf Stufen von
 * 1 (einzelner Treffer) bis 5 (häufigstes Thema), linear zwischen 1 und dem
 * Maximum. Rein — keine Importe —, damit Komponente und Test dasselbe
 * rechnen.
 *
 * Kommt jedes Thema nur einmal vor (Maximum 1), gibt es keine Spreizung;
 * dann steht alles in der Mitte statt winzig.
 *
 * @param {number} anzahl @param {number} max
 * @returns {1|2|3|4|5}
 */
export function groessenstufe(anzahl, max) {
  if (!(anzahl > 0) || !(max > 0)) return 1;
  if (max === 1) return 3;
  const stufe = 1 + Math.round((4 * (anzahl - 1)) / (max - 1));
  return /** @type {1|2|3|4|5} */ (Math.min(5, Math.max(1, stufe)));
}
