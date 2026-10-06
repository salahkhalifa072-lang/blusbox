import Link from "next/link";
import { Prijsblok } from "@/components/product/prijsblok";
import { gratisVerzending, prijsIncl } from "@/lib/pricing";
import { koopNu } from "@/app/winkelwagen/acties";

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

          {/*
            Koop nu gaat in één keer naar het afrekenen: de route van
            homepage naar betalen gaat van vijf stappen naar drie. Wie eerst
            wil lezen heeft de tweede knop; installateurs vinden hun pagina
            via de tekstlink en het menu.
          */}
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={koopNu}>
              <input type="hidden" name="slug" value="blusbox" />
              <button
                type="submit"
                className="group flex items-center gap-2 rounded-full bg-blusrood-vlak px-7 py-3.5 text-sm font-semibold text-kastwit shadow-[0_8px_24px_-8px_rgba(210,35,31,0.75)] transition-all hover:-translate-y-px hover:bg-[#9e1b18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kastwit motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                Koop nu · {prijsIncl}
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </button>
            </form>
            <Link
              href="/blusbox"
              className="rounded-full border border-kastwit/40 px-6 py-3.5 text-sm text-kastwit transition-colors hover:bg-kastwit hover:text-antraciet"
            >
              Meer over Blusbox
            </Link>
          </div>
          <Link
            href="/installateurs"
            className="data mt-4 inline-block text-xs text-kastwit/55 underline underline-offset-4 hover:text-kastwit"
          >
            Installateur? Bekijk de zakelijke voorwaarden →
          </Link>
        </div>
      </div>
    </div>
  );
}
