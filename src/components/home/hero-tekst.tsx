import Image from "next/image";
import Link from "next/link";
import {
  adviesprijs,
  KORTINGSPERCENTAGE,
  prijsIncl,
  TOON_ADVIESPRIJS,
  verzendwaarde,
} from "@/lib/pricing";
import { koopNu } from "@/app/winkelwagen/acties";
import { Sterren } from "@/components/reviews/sterren";
import { beoordelingenTotaal, toonCijfer } from "@/lib/reviews";
import { NIEUWSBRON } from "@/components/home/nieuws-en-module";

/**
 * De tekstkolom van de hero: nieuwsregel, kop, uitleg, prijs en knoppen.
 *
 * Los van het beeld, zodat beide beeldvarianten precies dezelfde tekst
 * dragen en de vergelijking alleen over het beeld gaat.
 *
 * Op een telefoon valt "Blusbox," uit de kop: het product staat er al
 * groot boven, en de kop past zo in twee regels minder. De h1 houdt het
 * merk wel, voor zoekmachines en schermlezers.
 *
 * Prijs, adviesprijs, verzending en knoppen staan in één kaart in plaats
 * van als losse regels onder elkaar. Elk gegeven één keer: de prijs staat
 * niet ook nog in de knop, en "incl. btw" staat naast de prijs in plaats
 * van op een eigen regel.
 */
export function HeroTekst() {
  const { gemiddelde, aantal } = beoordelingenTotaal();

  return (
    <div className="relative flex flex-col px-6 pb-10 lg:px-0 lg:pb-0">
      {/* Het nieuws, kort, als eerste wat je leest. Springt naar het
          blok verderop waar citaat, bron en link volledig staan; daar
          hoort de bronvermelding, hier alleen de aanleiding. */}
      <a
        href="#nieuws"
        className="group mb-5 flex w-fit max-w-full items-center gap-2.5 rounded-full border border-kastwit/15 bg-kastwit/5 py-1 pl-1 pr-3 text-xs text-kastwit/80 transition-colors hover:border-kastwit/30 hover:text-kastwit lg:mb-6"
      >
        <span className="inline-flex shrink-0 items-center rounded-full bg-kastwit px-2 py-1">
          <Image src="/media/bronnen/nos.svg" alt="NOS" width={72} height={40} className="h-3 w-auto" />
        </span>
        <span className="truncate">{NIEUWSBRON.kort}</span>
        <span aria-hidden className="shrink-0 transition-transform group-hover:translate-x-0.5">→</span>
      </a>

      <h1 className="font-display text-[clamp(2.4rem,10.5vw,3.4rem)] leading-[1.02] text-kastwit lg:text-[clamp(4rem,6vw,6rem)]">
        {/* Eén keer in de html; op een telefoon alleen onzichtbaar. */}
        <span className="sr-only text-blusrood-op-donker lg:not-sr-only">
          Blusbox, <br className="hidden lg:block" />
        </span>
        dé brandblusser voor in de{" "}
        <span className="text-blusrood-op-donker">meterkast!</span>
      </h1>

      <p className="mt-4 max-w-md text-kastwit/75 lg:mt-6">
        Een compacte blusmodule die bij{" "}
        <span className="data text-signaal">170 °C</span> vanzelf ingrijpt.
        Geen stroom. Geen bediening. Geen mens.
      </p>

      <div className="mt-6 max-w-md rounded-3xl bg-kastwit/[0.06] p-5 ring-1 ring-kastwit/10">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="data whitespace-nowrap text-3xl text-kastwit">
            {prijsIncl}
            <span className="ml-1.5 text-xs text-kastwit/50">incl. btw</span>
          </p>
          {TOON_ADVIESPRIJS && (
            <p className="flex items-center gap-2">
              {/* "adviesprijs" staat er zichtbaar bij: een kaal
                  doorgestreept bedrag leest als een oude prijs van deze
                  winkel, en dat is een andere bewering. Zie Prijsblok. */}
              <span className="data whitespace-nowrap text-sm text-kastwit/50">
                adviesprijs <span className="line-through">{adviesprijs}</span>
              </span>
              <span className="rounded-full bg-blusrood-vlak px-2 py-0.5 text-[11px] font-semibold text-kastwit">
                −{KORTINGSPERCENTAGE}%
              </span>
            </p>
          )}
        </div>

        <p className="mt-2 flex items-center gap-2 text-sm text-kastwit/80">
          <span aria-hidden className="text-[#6fcf97]">✓</span>
          Gratis verzending
          <span className="data text-xs text-kastwit/45">
            t.w.v. <span className="line-through">{verzendwaarde}</span>
          </span>
        </p>

        {/*
          Koop nu gaat in één keer naar het afrekenen: de route van
          homepage naar betalen gaat van vijf stappen naar drie. Wie eerst
          wil lezen heeft de tweede knop.
        */}
        <div id="hero-koop" className="mt-4 grid grid-cols-[1fr_auto] gap-2.5">
          <form action={koopNu}>
            <input type="hidden" name="slug" value="blusbox" />
            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-blusrood-vlak px-6 py-3.5 text-sm font-semibold text-kastwit shadow-[0_8px_24px_-8px_rgba(210,35,31,0.75)] transition-all hover:-translate-y-px hover:bg-[#9e1b18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kastwit motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              Koop nu
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </button>
          </form>
          <Link
            href="/blusbox"
            className="flex items-center rounded-full border border-kastwit/30 px-5 py-3.5 text-sm text-kastwit transition-colors hover:bg-kastwit hover:text-antraciet"
          >
            Meer info
          </Link>
        </div>

        {/* De beoordeling naast de knop: daar valt de beslissing, niet
            halverwege de pagina waar het reviewblok staat. */}
        <a
          href="#beoordelingen"
          className="mt-4 flex w-fit items-center gap-2 text-sm text-kastwit/70 hover:text-kastwit"
        >
          <Sterren waarde={gemiddelde} />
          <span className="data text-kastwit">{toonCijfer(gemiddelde)}</span>
          <span>· {aantal} beoordelingen</span>
        </a>
      </div>

      {/* Op een telefoon weg: daar staat de zakelijke route in het menu
          en onderaan de pagina, en hier zat hij de koopknop in de weg. */}
      <Link
        href="/installateurs"
        className="data mt-4 hidden w-fit text-xs text-kastwit/55 underline underline-offset-4 hover:text-kastwit lg:inline-block"
      >
        Installateur? Bekijk de zakelijke voorwaarden →
      </Link>
    </div>
  );
}
