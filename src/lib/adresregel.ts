/**
 * Een Nederlandse adresregel splitsen in straat en huisnummer.
 *
 * Stripe geeft het bezorgadres als één regel ("Biezelingsestraat 22B"),
 * onze bestelling bewaart straat en huisnummer apart — het verzendlabel
 * vraagt ze ook apart. Het huisnummer is het laatste stuk dat met een
 * cijfer begint, inclusief toevoeging ("22B", "12-3", "7 hs", "4 bis").
 *
 * Lukt het splitsen niet, dan gaat de hele regel in de straat en blijft
 * het huisnummer leeg. Liever een label dat iemand even nakijkt dan een
 * huisnummer dat er half uit is geknipt.
 */
export function splitsAdresregel(regel: string): { straat: string; huisnummer: string } {
  const schoon = regel.trim().replace(/\s+/g, " ");
  const m = /^(.*\D)\s+(\d+(?:\s?[-/]?\s?[A-Za-z0-9]{1,4})?(?:\s(?:hs|bis|bg|rd|zw|ii|iii))?)$/i.exec(schoon);
  if (!m || !m[1].trim()) return { straat: schoon, huisnummer: "" };
  return { straat: m[1].trim(), huisnummer: m[2].replace(/\s+/g, " ").trim() };
}
