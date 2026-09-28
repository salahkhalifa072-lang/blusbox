import {
  adviesprijs,
  prijsIncl,
  KORTINGSPERCENTAGE,
  TOON_ADVIESPRIJS,
} from "@/lib/pricing";

/**
 * De prijs met de adviesprijs ernaast en het verschil in een badge.
 *
 * Eén component voor de homepage én de productpagina, omdat het anders
 * misgaat zoals het nu misging: de productpagina toonde de doorgestreepte
 * adviesprijs wel en de homepage niet, en daar valt de belangrijkste reden
 * om door te klikken precies weg. Een prijs die op twee plekken anders
 * wordt gepresenteerd is bovendien een prijs die bezoekers gaan wantrouwen.
 *
 * Over het woord dat er niet staat: "korting". Dat is juridisch een
 * aankondiging van prijsvermindering, en dan moet je de laagste prijs van
 * de afgelopen dertig dagen tonen (art. 6:12b BW). Wat hier staat is het
 * verschil met de adviesprijs, en dat is een andere claim. Zie lib/pricing.
 *
 * Twee formaten. "groot" voor een koopblok waar de prijs het zwaarste
 * element mag zijn, "normaal" voor een hero waar de kop dat al is.
 */
export function Prijsblok({
  formaat = "normaal",
}: {
  /** "groot" voor het koopblok, "normaal" voor de hero. */
  formaat?: "normaal" | "groot";
}) {
  const prijsMaat = formaat === "groot" ? "text-3xl" : "text-2xl";
  const adviesMaat = formaat === "groot" ? "text-lg" : "text-base";

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
      <span className={`data ${prijsMaat} text-kastwit`}>{prijsIncl}</span>

      {TOON_ADVIESPRIJS && (
        <>
          <span
            className={`data ${adviesMaat} text-railstaal line-through`}
            // De adviesprijs is een vergelijking, geen bedrag dat iemand
            // betaalt. Zonder dit leest een schermlezer twee prijzen achter
            // elkaar voor en klinkt het alsof je 67,49 kwijt bent.
            aria-label={`adviesprijs ${adviesprijs}`}
          >
            {adviesprijs}
          </span>
          <span className="rounded-full bg-blusrood-vlak px-3 py-1 text-xs font-medium text-kastwit">
            −{KORTINGSPERCENTAGE}%
          </span>
        </>
      )}
    </div>
  );
}
