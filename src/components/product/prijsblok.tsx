import { prijsIncl } from "@/lib/pricing";

/**
 * De prijs, op de homepage en de productpagina in dezelfde vorm.
 *
 * Eén component voor beide, omdat een prijs die op twee plekken anders
 * wordt gepresenteerd een prijs is die bezoekers gaan wantrouwen.
 *
 * Hier stond eerder een doorgestreepte adviesprijs met een "−20%"-badge.
 * Die is er op verzoek uit (oktober 2026); korting loopt nu via een
 * kortingscode bij het afrekenen. Komt er ooit weer een vergelijkingsprijs
 * terug: dat is een aankondiging van prijsvermindering zodra het als
 * korting leest, en dan geldt art. 6:12b BW (laagste prijs van de
 * afgelopen dertig dagen).
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

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
      <span className={`data ${prijsMaat} text-kastwit`}>{prijsIncl}</span>
    </div>
  );
}
