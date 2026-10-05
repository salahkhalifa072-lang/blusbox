-- De ELRO-rookmelder die bij het afrekenen wordt aangeboden.
--
-- Een bestelling legt per regel een verwijzing naar de producttabel vast,
-- en weigert een artikel dat daar niet staat. Zonder deze rij zou elke
-- bestelling met een rookmelder op het laatste moment worden afgewezen.
--
-- commissie_uitgesloten = true: geen affiliatecommissie over een
-- meeverkocht product met een kleine marge. De rest van de bestelling
-- telt gewoon mee.
--
-- Idempotent: draait mee in vercel-build. DO NOTHING laat een later in
-- het dashboard aangepaste rij met rust.

INSERT INTO "products" ("slug", "naam", "omschrijving", "prijs_excl_btw_centen", "btw_percentage", "voorraad", "actief", "commissie_uitgesloten")
VALUES (
  'rookmelder',
  'ELRO rookmelder FS1801',
  'Optische rookmelder volgens EN 14604, alarm van 85 dB, testknop en melding bij een lege batterij. Inclusief batterij en bevestigingsmateriaal.',
  1401,
  21,
  0,
  true,
  true
)
ON CONFLICT ("slug") DO NOTHING;
