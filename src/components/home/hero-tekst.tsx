import Link from "next/link";
import { Prijsblok } from "@/components/product/prijsblok";
import { gratisVerzending } from "@/lib/pricing";

/**
 * De tekstkolom van de hero: kop, uitleg, prijs en knoppen.
 *
 * Los van het beeld, zodat beide beeldvarianten precies dezelfde tekst
 * dragen en de vergelijking alleen over het beeld gaat.
 *
 * De specificatiekaartjes (170 °C, 0 W, …) staan hier niet meer. Ze
 * herhaalden wat de belofterij direct eronder ook zegt, en op mobiel
 * kostten ze een halve schermhoogte voordat de pagina verderging.
 */
export function HeroTekst() {
  return (
    <div className="relative flex flex-col gap-6 px-6 pb-12 lg:gap-2 lg:px-0 lg:pb-0">
      {/* Eén zin over twee blokken. De h1 draagt de hele zin voor
          schermlezers; de tweede helft wordt eronder geschilderd. */}
      <h1 className="font-display text-[clamp(2.75rem,11vw,7.5rem)] leading-[1.02] lg:text-[clamp(4rem,6vw,6rem)]">
        <span aria-hidden className="text-blusrood-op-donker">
          Blusbox,
        </span>
        <br aria-hidden />
        <span aria-hidden className="text-kastwit">
          dé brandblusser
        </span>
        <span className="sr-only">Blusbox, dé brandblusser voor in de meterkast!</span>
      </h1>

      <div>
        <p
          aria-hidden
          className="font-display text-[clamp(2.75rem,11vw,7.5rem)] leading-[1.02] lg:text-[clamp(4rem,6vw,6rem)]"
        >
          <span className="text-kastwit">voor in de </span>
          <span className="text-blusrood-op-donker">meterkast!</span>
        </p>

        <div className="mt-8 max-w-md border-t border-kastwit/15 pt-6">
          <p className="text-kastwit/75">
            Een compacte blusmodule in je meterkast die bij{" "}
            <span className="data text-signaal">170 °C</span> vanzelf ingrijpt.
            Geen stroom. Geen bediening. Geen mens.
          </p>

          <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-2">
            <Prijsblok />
            <span className="data rounded-full border border-kastwit/30 px-3 py-1 text-xs text-kastwit/70">
              {gratisVerzending.kort}
            </span>
          </div>
          <p className="data mt-2 text-xs text-kastwit/50">incl. btw</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/blusbox"
              className="rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kastwit"
            >
              Bekijk Blusbox
            </Link>
            <Link
              href="/installateurs"
              className="rounded-full border border-kastwit/40 px-6 py-3 text-sm text-kastwit transition-colors hover:bg-kastwit hover:text-antraciet"
            >
              Voor installateurs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
