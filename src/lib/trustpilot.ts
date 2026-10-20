/**
 * Trustpilot: vaste gegevens van het Blusbox-profiel.
 *
 * Geen van beide is geheim. Het bedrijfs-ID staat in elke widget die een
 * bezoeker in de broncode kan lezen, en het uitnodigingsadres accepteert
 * alleen post die het als bestelbevestiging herkent.
 */

export const TRUSTPILOT_BEDRIJF_ID = "6ad7506ac306c18a1330ea36";

/** Persoonlijk adres voor de automatische uitnodigingen (AFS). */
export const TRUSTPILOT_UITNODIGING =
  process.env.TRUSTPILOT_UITNODIGING ?? "blusbox.nl+c43d3d27a3@invite.trustpilot.com";

export const TRUSTPILOT_PROFIEL = "https://nl.trustpilot.com/review/blusbox.nl";

/** Directe link naar het schrijfscherm, voor handmatige verzoeken. */
export const TRUSTPILOT_SCHRIJVEN = "https://nl.trustpilot.com/evaluate/blusbox.nl";
