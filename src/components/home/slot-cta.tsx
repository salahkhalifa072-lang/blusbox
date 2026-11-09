import Image from "next/image";
import Link from "next/link";
import { koopNu } from "@/app/winkelwagen/acties";
import { SectieLabel } from "@/components/ui/sectielabel";
import { Reveal } from "@/components/ui/reveal";
import { Sterren } from "@/components/reviews/sterren";
import { beoordelingenTotaal, toonCijfer } from "@/lib/reviews";
import { adviesprijs, gratisVerzending, prijsIncl, TOON_ADVIESPRIJS, verzendwaarde } from "@/lib/pricing";

/**
 * Het slot van de homepage: nog één keer de prijs en de knop.
 *
 * Wie tot hier scrolt, heeft alles gelezen en zoekt alleen nog waar hij
 * kan kopen. Dan hoort de knop er te staan, niet een keuze tussen twee
 * doelgroepen. De zakelijke route blijft als regel eronder.
 */
const beloften = [
  `${gratisVerzending.kort} · t.w.v. ${verzendwaarde}`,
  "14 dagen bedenktijd",
  "10 jaar levensduur, met bericht vóór vervanging",
];

export function SlotCta() {
  const { gemiddelde, aantal } = beoordelingenTotaal();

  return (
    <section className="px-3 pb-3 sm:px-4 sm:pb-4" aria-labelledby="slot-kop">
      <div
        id="slot-koop"
        className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-antraciet text-kastwit lg:grid-cols-[1.2fr_1fr]"
      >
        <Reveal className="p-6 sm:p-14">
          <SectieLabel donker>bestellen</SectieLabel>
          <h2 id="slot-kop" className="font-display mt-5 text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.02]">
            Eén module.
            <br />
            <span className="text-blusrood-op-donker">Tien jaar rust.</span>
          </h2>

          <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="data whitespace-nowrap text-3xl sm:text-4xl">{prijsIncl}</span>
            {TOON_ADVIESPRIJS && (
              <span className="data whitespace-nowrap text-sm text-kastwit/50 line-through">{adviesprijs}</span>
            )}
            <span className="data whitespace-nowrap text-xs text-kastwit/50">incl. btw</span>
          </p>

          <ul className="mt-6 space-y-2 text-sm text-kastwit/80">
            {beloften.map((b) => (
              <li key={b} className="flex gap-3">
                <span aria-hidden className="text-blusrood-op-donker">✓</span>
                {b}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <form action={koopNu}>
              <input type="hidden" name="slug" value="blusbox" />
              <button
                type="submit"
                className="group flex items-center gap-2 rounded-full bg-blusrood-vlak px-8 py-4 text-base font-semibold text-kastwit shadow-[0_8px_24px_-8px_rgba(210,35,31,0.75)] transition-all hover:-translate-y-px hover:bg-[#9e1b18] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                Koop nu · {prijsIncl}
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </button>
            </form>
            <a href="#beoordelingen" className="flex items-center gap-2 text-sm text-kastwit/70 hover:text-kastwit">
              <Sterren waarde={gemiddelde} />
              <span className="data">{toonCijfer(gemiddelde)}</span>
              <span>· {aantal} beoordelingen</span>
            </a>
          </div>

          <p className="mt-8 border-t border-kastwit/15 pt-6 text-sm text-kastwit/60">
            Installateur, VvE of woningcorporatie?{" "}
            <Link href="/zakelijk" className="text-kastwit underline underline-offset-4">
              Staffelprijzen en levering op rekening →
            </Link>
          </p>
        </Reveal>

        <div className="relative min-h-[16rem] sm:min-h-[22rem] lg:min-h-0">
          <Image
            src="/media/echt/doos-en-module-boven.jpg"
            alt="Blusbox-doos met de rode blusmodule en het blauwe detectiekoord ernaast op tafel, van bovenaf"
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
