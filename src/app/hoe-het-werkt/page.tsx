import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader, SectionTitle } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { VideoBlock } from "@/components/ui/video-block";
import { Reveal } from "@/components/ui/reveal";
import { LogoBadge } from "@/components/site/logo";
import { ClaimSource } from "@/components/ui/claim-source";

export const metadata: Metadata = {
  title: "Hoe het werkt",
  description:
    "Van een warme klem tot een gedoofde kast: hoe Blusbox bij 170 °C zichzelf activeert, wat condensed aerosol doet en waar de module wél en niet voor is.",
  alternates: { canonical: "/hoe-het-werkt" },
};

export default function HoeHetWerktPage() {
  return (
    <>
      <PageHeader
        eyebrow="drie akten"
        title="Warmte, drempel,"
        accent="stilte."
        lead="Blusbox doet drie dingen, in deze volgorde. Meer dan dat gebeurt er niet — en dat is precies de bedoeling."
      />
      <main>
        {/* Act 1 */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="data text-xs uppercase tracking-widest text-staal-tekst">
                akte 1
              </p>
              <SectionTitle className="mt-3">
                Het begint bij een verbinding die niet meer klopt
              </SectionTitle>
              <p className="mt-5 text-staal-tekst">
                Een klem die is losgetrild, een aansluiting die net niet goed is
                aangedraaid, een kabel die jaren te warm heeft gelegen. De
                weerstand op dat ene punt loopt op, en waar weerstand oploopt
                ontstaat warmte.
              </p>
              <p className="mt-4 text-staal-tekst">
                Dat proces is traag en stil. Er gaat geen melder af, er valt
                geen groep uit, en de aardlekschakelaar ziet geen aardlek. De
                installatie is technisch nog in orde — tot het isolatiemateriaal
                het opgeeft.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <div className="relative aspect-video overflow-hidden rounded-2xl">
                <Image
                  src="/media/canyon.jpg"
                  alt="Filmstill: rijen automaten in een meterkast, gefilmd als een industrieel landschap"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
                <LogoBadge />
              </div>
            </Reveal>
          </div>
        </section>

        {/* Act 2 */}
        <section className="bg-antraciet py-20 text-kastwit">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <Reveal className="lg:order-2">
                <p className="data text-xs uppercase tracking-widest text-railstaal">
                  akte 2
                </p>
                <SectionTitle className="mt-3">
                  Bij <span className="data">170 °C</span> beslist de natuurkunde
                </SectionTitle>
                <p className="mt-5 text-kastwit/70">
                  Langs de module loopt een detectiekoord. Dat koord meet niet,
                  het reageert: bereikt het ongeveer 170 °C, dan activeert de
                  module zichzelf. Geen sensor die kan uitvallen, geen printplaat
                  die kan doorbranden, geen batterij die leeg kan zijn.
                </p>
                <p className="mt-4 text-kastwit/70">
                  Wat vrijkomt is een heet aerosol op basis van een Sr/KNO₃-
                  oxidator. De fijne deeltjes verspreiden zich door de hele kast
                  en onderbreken de kettingreactie die een vlam in stand houdt.
                  De brand dooft van binnenuit in plaats van te worden
                  weggeblazen.
                </p>
                <p className="mt-4 text-kastwit/70">
                  De ontwerpdichtheid is{" "}
                  <span className="data text-kastwit">100 g/m³</span>: de
                  hoeveelheid blusmiddel per kubieke meter waar de module op is
                  ontworpen. Daarom is het volume van de kast een ontwerpvraag en
                  geen detail.
                </p>
                <ClaimSource label="[VERIFY: bron voor werkingsprincipe en ontwerpdichtheid]" />
              </Reveal>
              <Reveal delay={100} className="lg:order-1">
                <div className="relative aspect-video overflow-hidden rounded-2xl">
                  <VideoBlock
                    src="/media/discharge.mp4"
                    poster="/media/discharge.jpg"
                    label="Filmfragment: een wit aerosolfront verspreidt zich door de kast en dooft de vuurgloed"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <LogoBadge />
                </div>
                <p className="data mt-3 text-xs text-railstaal">
                  Beeld is een weergave.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Act 3 — the honest boundary */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <p className="data text-xs uppercase tracking-widest text-staal-tekst">
              akte 3
            </p>
            <SectionTitle className="mt-3">
              Waar Blusbox wél en <span className="accent">niet</span> voor is
            </SectionTitle>
            <p className="mt-5 max-w-2xl text-staal-tekst">
              Een blusmodule die alles zou kunnen, kan niets bewijzen. Daarom
              hier de grens, zo scherp als we hem kunnen trekken.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-railstaal/50 p-8">
                <h3 className="font-display text-2xl">Hier is het voor</h3>
                <ul className="mt-5 space-y-3 text-sm text-staal-tekst">
                  {[
                    "Een beginnende brand in een afgesloten elektrische behuizing — de meterkast of groepenkast.",
                    "Situaties waarin niemand aanwezig is of kan ingrijpen.",
                    "Installaties waar het uitvallen van de voeding juist het probleem is: de module heeft geen stroom nodig.",
                    "Als laatste laag, ná goede installatie, inspectie en aardlekbeveiliging.",
                  ].map((t) => (
                    <li key={t} className="flex gap-3">
                      <span className="data text-blusrood-op-licht" aria-hidden>
                        —
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="h-full rounded-2xl border border-railstaal/50 bg-kastwit-dim p-8">
                <h3 className="font-display text-2xl">Hier is het niet voor</h3>
                <ul className="mt-5 space-y-3 text-sm text-staal-tekst">
                  {[
                    "Een brand in de woning zelf. Blusbox werkt in het volume van de kast, niet in een kamer.",
                    "Vervanging van rookmelders. Die waarschuwen mensen; Blusbox waarschuwt niemand.",
                    "Vervanging van een aardlekschakelaar, een goede installatie of periodieke inspectie.",
                    "Een reden om achterstallig onderhoud te laten zitten.",
                  ].map((t) => (
                    <li key={t} className="flex gap-3">
                      <span className="data text-staal-tekst" aria-hidden>
                        —
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Aftermath */}
        <section className="bg-antraciet py-20 text-kastwit">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="data text-xs uppercase tracking-widest text-railstaal">
                daarna
              </p>
              <SectionTitle className="mt-3">
                Er gebeurde <span className="accent">niets</span>
              </SectionTitle>
              <p className="mt-5 text-kastwit/70">
                Het residu is niet-geleidend en niet-corrosief voor de omliggende
                installatie. De kast is vervuild, de module is verbruikt, en de
                rest van je huis heeft er niets van gemerkt.
              </p>
              <p className="mt-4 text-kastwit/70">
                Laat de installatie na een activering altijd controleren door een
                installateur: de oorzaak van de warmte zit er nog. Meld de
                activering in je account, dan gaat de vervangmodule direct mee.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/blusbox"
                  className="rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
                >
                  Bekijk Blusbox
                </Link>
                <Link
                  href="/veelgestelde-vragen"
                  className="rounded-full border border-kastwit/40 px-6 py-3 text-sm transition-colors hover:bg-kastwit hover:text-antraciet"
                >
                  Veelgestelde vragen
                </Link>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="relative aspect-video overflow-hidden rounded-2xl">
                <Image
                  src="/media/hallway.jpg"
                  alt="Gewone Nederlandse gang in ochtendlicht met gesloten meterkastdeur"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
                <LogoBadge />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
