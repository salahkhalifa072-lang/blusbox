import { SectieLabel } from "@/components/ui/sectielabel";
import { UitlegSpeler } from "@/components/home/uitleg-speler";
import { koopNu } from "@/app/winkelwagen/acties";
import { gratisVerzending, prijsIncl } from "@/lib/pricing";
import { siteUrl } from "@/lib/site";
import {
  HOOFDSTUKKEN,
  TRANSCRIPT,
  UITLEGVIDEO,
  tijdcode,
} from "@/lib/uitlegvideo";

/**
 * De uitlegvideo als eigen blok, op de plek waar de scrollvideo stond.
 *
 * Die scrollvideo liet met een render hetzelfde verhaal zien (brand,
 * module grijpt in), maar kostte twee schermen scrollen. De reel vertelt
 * het met een echt persoon in een echte meterkast, en neemt de plaatsing
 * er meteen bij.
 *
 * Onder de video staan de bron van het cijfer dat erin genoemd wordt en de
 * volledige tekst: voor wie niet kan of wil kijken, en voor zoekmachines.
 *
 * Staat ook op de productpagina, direct onder het koopblok. Daar sluit hij
 * aan op het donkere vlak erboven, met alleen een dunne lijn ertussen.
 */
export function Uitlegvideo({
  pad = "/",
  aansluitend = false,
}: {
  /** De pagina waar hij op staat: de hoofdstuklinks voor Google wijzen daarheen. */
  pad?: string;
  /** Volgt direct op een ander donker vlak: geen eigen bovenruimte, wel een lijn. */
  aansluitend?: boolean;
} = {}) {
  const gegevens = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: "Blusbox in 45 seconden: brand in de meterkast en hoe je hem voorkomt",
    description:
      "Waarom de meterkast steeds zwaarder belast wordt, hoe de Blusbox-module ingrijpt bij een beginnende brand en hoe je hem in twee stappen op de DIN-rail klikt.",
    thumbnailUrl: [`${siteUrl}${UITLEGVIDEO.poster}`],
    uploadDate: `${UITLEGVIDEO.geplaatst}T12:00:00+01:00`,
    duration: `PT${UITLEGVIDEO.duurSeconden}S`,
    contentUrl: `${siteUrl}${UITLEGVIDEO.src}`,
    inLanguage: "nl-NL",
    transcript: TRANSCRIPT.join(" "),
    hasPart: HOOFDSTUKKEN.map((h, i) => ({
      "@type": "Clip",
      name: h.titel,
      startOffset: Math.floor(h.start),
      endOffset: Math.floor(
        HOOFDSTUKKEN[i + 1]?.start ?? UITLEGVIDEO.duurSeconden,
      ),
      url: `${siteUrl}${pad}?t=${Math.floor(h.start)}`,
    })),
  };

  return (
    <section
      id="uitleg"
      aria-labelledby="uitleg-kop"
      className={`scroll-mt-24 bg-antraciet text-kastwit ${aansluitend ? "pb-14 sm:pb-24" : "py-14 sm:py-24"}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gegevens) }}
      />
      <div className="mx-auto max-w-6xl px-6">
        <div
          className={
            aansluitend
              ? "border-t border-kastwit/10 pt-14 sm:pt-20"
              : undefined
          }
        >
          <UitlegSpeler
            inleiding={
              <>
                <SectieLabel donker>in 45 seconden</SectieLabel>
                <h2
                  id="uitleg-kop"
                  className="font-display mt-4 text-[clamp(2rem,5vw,3.5rem)] leading-[1.05]"
                >
                  Uitgelegd waar hij hoort:
                  <br />
                  <span className="accent">in de meterkast</span>
                </h2>
                <p className="mt-4 max-w-md text-kastwit/70">
                  Waarom juist de meterkast, wat de module doet als het misgaat,
                  en hoe je hem zelf plaatst. Kies een onderdeel om er meteen
                  naartoe te springen.
                </p>
              </>
            }
            onder={
              <>
                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <form action={koopNu}>
                    <input type="hidden" name="slug" value="blusbox" />
                    <button
                      type="submit"
                      className="group flex items-center gap-2 rounded-full bg-blusrood-vlak px-6 py-3.5 text-sm font-semibold text-kastwit transition-colors hover:bg-[#9e1b18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kastwit"
                    >
                      Koop nu
                      <span
                        aria-hidden
                        className="transition-transform group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </button>
                  </form>
                  <p className="data text-sm text-kastwit/70">
                    {prijsIncl} · {gratisVerzending.kort.toLowerCase()}
                  </p>
                </div>

                <p className="mt-6 max-w-md text-xs leading-relaxed text-kastwit/45">
                  Het cijfer in de video komt van Netbeheer Nederland: drie
                  elektriciteitsongelukken in huis per week, waar het er eerder
                  twee waren (
                  <a
                    href="#nieuws"
                    className="underline underline-offset-2 hover:text-kastwit"
                  >
                    NOS
                  </a>
                  ). &ldquo;Morgen in huis&rdquo; geldt op werkdagen. De
                  animatie van de module en de brandbeelden zijn een weergave.
                </p>

                <details className="group mt-4 max-w-md">
                  <summary className="data cursor-pointer list-none text-xs text-kastwit/60 hover:text-kastwit [&::-webkit-details-marker]:hidden">
                    <span
                      aria-hidden
                      className="mr-1.5 inline-block transition-transform group-open:rotate-90"
                    >
                      ›
                    </span>
                    Lees de tekst van de video
                  </summary>
                  <div className="mt-3 space-y-3 border-l border-kastwit/15 pl-4 text-sm text-kastwit/70">
                    {TRANSCRIPT.map((alinea, i) => (
                      <p key={i}>
                        <span className="data mr-2 text-xs text-kastwit/40">
                          {tijdcode(HOOFDSTUKKEN[i]?.start ?? 0)}
                        </span>
                        {alinea}
                      </p>
                    ))}
                  </div>
                </details>
              </>
            }
          />
        </div>
      </div>
    </section>
  );
}
