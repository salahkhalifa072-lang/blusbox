import Link from "next/link";
import { PROGRAMMA } from "@/lib/affiliate/teksten";

/**
 * Korte uitnodiging om partner te worden.
 *
 * Een smalle band en geen volle sectie: dit is niet waarvoor iemand de
 * site bezoekt. Wie een blusmodule zoekt moet er niet doorheen hoeven
 * scrollen, en wie toevallig een publiek heeft ziet hem wel.
 *
 * Daarom ook onderaan, ná de beoordelingen. Bovenaan zou hij concurreren
 * met de bestelknop, en een bezoeker die twijfelt tussen kopen en
 * aanmelden doet uiteindelijk geen van beide.
 *
 * Geen verdienbeloftes. Het percentage staat er, de rest kan iemand zelf
 * doorrekenen — "verdien tot € x per maand" is precies de claim die je
 * niet kunt onderbouwen als je het bereik van de aanvrager niet kent.
 */
export function Partnerband() {
  return (
    <section className="bg-antraciet py-14 text-kastwit">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <p className="data text-xs uppercase tracking-widest text-railstaal">
            partnerprogramma
          </p>
          <p className="font-display mt-2 text-2xl sm:text-3xl">
            Verdien <span className="accent">{PROGRAMMA.percentage}%</span> met
            je eigen link
          </p>
          <p className="mt-2 text-sm leading-relaxed text-kastwit/65">
            Schrijf je over wonen, klussen of veiligheid? Deel je
            persoonlijke link. Bestelt iemand binnen{" "}
            {PROGRAMMA.attributieDagen} dagen een Blusbox, dan gaat een vijfde
            van de productwaarde naar jou. Geen kosten, geen minimum.
          </p>
        </div>

        <Link
          href="/affiliate"
          className="shrink-0 self-start rounded-full border border-kastwit/40 px-6 py-3 text-sm transition-colors hover:bg-kastwit hover:text-antraciet sm:self-auto"
        >
          Bekijk het programma
        </Link>
      </div>
    </section>
  );
}
