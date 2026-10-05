/**
 * Single source of truth for price and shipping.
 * Consumer prices are shown incl. btw, business prices excl. (§8).
 */

export const BTW_TARIEF = 0.21;

/** Consumer price incl. btw, in euro cents to avoid float drift. */
export const PRIJS_INCL_CENTEN = 4950;

/**
 * Adviesprijs: de prijs die installateurs en wederverkopers voeren.
 *
 * Bewust géén "van"-prijs. Een doorgestreepte vanprijs is een aankondiging
 * van een prijsvermindering, en daarvoor schrijft de Omnibus-richtlijn
 * (art. 6:12b BW) voor dat je de láágste prijs van de afgelopen dertig
 * dagen toont. Blusbox heeft nooit € 37,50 gerekend — de prijs was € 28,95
 * — dus "van € 37,50 voor € 30,00" zou onjuist zijn en is precies waar de
 * ACM op handhaaft.
 *
 * Een adviesprijs is een andere claim: niet "dit kostte het hier", maar
 * "dit is de prijs die in de markt geadviseerd wordt".
 *
 * € 72,95 is de consumentenadviesprijs, opgegeven door de eigenaar.
 * De winkel zelf vraagt € 49,50.
 */
export const ADVIESPRIJS_CENTEN = 7295;

/** What shipping would have cost. Never charged — used to show the saving. */
export const VERZENDWAARDE_CENTEN = 600;

/**
 * Derived, not stored separately: the advertised gross price is the
 * canonical one. btw follows by subtraction, so € 28,95 is exactly
 * representable — adding rounded btw to a net price cannot produce it.
 */
export const PRIJS_EXCL_CENTEN = Math.round(
  PRIJS_INCL_CENTEN / (1 + BTW_TARIEF),
);

/** The btw actually charged on one module, by subtraction. */
export const PRIJS_BTW_CENTEN = PRIJS_INCL_CENTEN - PRIJS_EXCL_CENTEN;

/** nl-NL money: comma decimal, non-breaking space after the sign. */
export function euro(centen: number): string {
  return `€ ${(centen / 100).toLocaleString("nl-NL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Hoeveel procent de eigen prijs onder de adviesprijs ligt.
 *
 * Afgeleid en niet apart opgeschreven: een los percentage naast twee
 * bedragen gaat vroeg of laat uit de pas lopen zodra er één verandert,
 * en dan staat er een kortingspercentage op de site dat niet klopt.
 */
export const KORTINGSPERCENTAGE = Math.round(
  ((ADVIESPRIJS_CENTEN - PRIJS_INCL_CENTEN) / ADVIESPRIJS_CENTEN) * 100,
);

/*
 * Let op bij hergebruik: zodra de winkelprijs gelijk is aan de
 * adviesprijs is dit 0. Gebruik het alleen achter TOON_ADVIESPRIJS, want
 * "0% korting" op een pagina is erger dan geen percentage.
 */

/**
 * Toont de site de adviesprijs naast de eigen prijs?
 *
 * Een bewuste schakelaar en niet afgeleid van "is de adviesprijs
 * hoger". Die afleiding koppelde twee onafhankelijke beslissingen aan
 * elkaar: wat de adviesprijs ís, en of wij ons daarmee willen
 * vergelijken. Met de adviesprijs op € 49,99 zou de site uit zichzelf
 * een doorgestreepte prijs met −25% tonen, en dat is precies het
 * kortingsvignet dat er op verzoek af moest.
 *
 * Staat hij op false, dan toont de site één prijs en loopt korting
 * uitsluitend via een kortingscode bij het afrekenen. Op true komt de
 * vergelijking terug, inclusief KORTINGSPERCENTAGE hierboven — en dan
 * geldt de waarschuwing bij ADVIESPRIJS_CENTEN weer onverkort: hij moet
 * echt gehanteerd worden in de markt.
 */
export const TOON_ADVIESPRIJS = true;

export const prijsIncl = euro(PRIJS_INCL_CENTEN);
export const adviesprijs = euro(ADVIESPRIJS_CENTEN);
export const prijsExcl = euro(PRIJS_EXCL_CENTEN);
export const verzendwaarde = euro(VERZENDWAARDE_CENTEN);

/**
 * Shipping is free on every order, to every destination we can ship to.
 * There is no threshold — so never phrase it as "vanaf € x".
 */
export const gratisVerzending = {
  kort: "Altijd gratis verzending",
  metWaarde: `Altijd gratis verzending — t.w.v. ${verzendwaarde}`,
  uitleg: `Bij elke bestelling, zonder minimumbedrag. Wij rekenen nooit ${verzendwaarde} verzendkosten door.`,
} as const;
