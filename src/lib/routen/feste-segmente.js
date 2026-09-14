/**
 * Die festen Segmente der ersten Pfadebene (ADR-0029): Adressen, die der Hub
 * selbst belegt und die deshalb kein `d` eines Beitrags sein dürfen. Ein `d`,
 * das einem davon gleicht, wäre unerreichbar — die Route gewönne.
 *
 * Die Liste steht hier als Konstante, damit `src/lib/routen/feste-segmente.test.js`
 * sie gegen den Bestand halten kann, statt sie in Tests neu zu behaupten.
 *
 * @type {readonly string[]}
 */
export const FESTE_SEGMENTE = Object.freeze(['blog', 'themen', 'en', 'feed.xml', 'sitemap.xml']);
