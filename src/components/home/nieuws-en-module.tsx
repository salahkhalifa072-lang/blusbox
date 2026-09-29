import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { VideoBlock } from "@/components/ui/video-block";
import { LogoBadge } from "@/components/site/logo";
import { Reveal } from "@/components/ui/reveal";

/**
 * Het nieuwsbericht en het product, in één blok.
 *
 * Stonden eerst als twee volle secties onder elkaar: eerst de
 * berichtgeving, daarna "Eén module. Geen aansluiting." Samen namen ze
 * bijna twee schermen in beslag terwijl het één gedachte is — dit is het
 * probleem, dit is wat wij eraan doen. Uit elkaar getrokken moest de
 * bezoeker die verbinding zelf leggen, en op een telefoon lag er dan ook
 * nog een halve scherm tussen.
 *
 * De volgorde is niet omkeerbaar. Eerst waaróm het probleem bestaat, dan
 * pas het product; andersom leest het als een verkooppraatje met een
 * krantenknipsel eronder.
 *
 * Over het NOS-logo: dat staat hier als bronvermelding bij een citaat,
 * niet als keurmerk. Het verschil zit in de plaatsing — klein, in de
 * regel met medium en datum, náást het citaat dat eruit komt, en niet als
 * losse badge boven de koopknop. De NOS beveelt dit product niet aan; het
 * artikel gaat over overbelaste meterkasten en noemt Blusbox nergens. Het
 * merkteken staat op een licht vlak omdat je een logo niet hoort te
 * verkleuren en het grijs erin op antraciet wegvalt.
 */

const BRON = {
  titel:
    "Steeds vaker brand in meterkast door verkeerd aansluiten van warmtepomp en laadpaal",
  medium: "NOS Nieuws",
  datum: "27 juli",
  url: "https://nos.nl/artikel/2624596-steeds-vaker-brand-in-meterkast-door-verkeerd-aansluiten-van-warmtepomp-en-laadpaal",
} as const;

export function NieuwsEnModule() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <Reveal>
        <div className="overflow-hidden rounded-3xl bg-antraciet text-kastwit">
          {/* Warme accentlijn als bovenrand. Het enige kleurvlak in het
              blok, zodat het oog daar begint en niet bij het logo. */}
          <div className="h-1 w-full bg-gradient-to-r from-blusrood via-[#e0952f] to-blusrood" />

          <div className="p-6 sm:p-9 lg:p-11">
            {/* ---------------------------------------- het nieuws */}
            <div className="lg:grid lg:grid-cols-[1.5fr_1fr] lg:gap-10">
              <div>
                <p className="data text-[11px] uppercase tracking-[0.18em] text-railstaal">
                  in het nieuws
                </p>

                <blockquote className="mt-3" cite={BRON.url}>
                  <p className="font-display text-[clamp(1.35rem,3vw,2.2rem)] leading-[1.14]">
                    <span className="text-blusrood-op-donker">“</span>
                    {BRON.titel}
                    <span className="text-blusrood-op-donker">”</span>
                  </p>
                </blockquote>

                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="inline-flex items-center rounded-md bg-kastwit px-2 py-1">
                    <Image
                      src="/media/bronnen/nos.svg"
                      alt="NOS"
                      width={72}
                      height={40}
                      className="h-3.5 w-auto"
                    />
                  </span>
                  <span className="data text-[11px] text-railstaal">
                    {BRON.medium} · {BRON.datum}
                  </span>
                  <a
                    href={BRON.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="data text-[11px] text-kastwit/80 underline underline-offset-4 transition-colors hover:text-blusrood-op-donker"
                  >
                    Lees het artikel ↗
                    <span className="sr-only">(opent in een nieuw venster)</span>
                  </a>
                </div>
              </div>

              {/* Cijfer uit het artikel. Op mobiel onder het citaat, op
                  desktop ernaast — zo blijft de bovenrand van het blok
                  gevuld in plaats van half leeg. */}
              <div className="mt-6 flex items-center gap-4 rounded-2xl border border-kastwit/15 bg-kastwit/5 p-4 lg:mt-0">
                <p className="data text-4xl leading-none text-kastwit">3</p>
                <p className="text-xs leading-snug text-kastwit/60">
                  elektriciteitsongelukken in huis per week, was er twee.
                  <span className="mt-0.5 block text-kastwit/40">
                    Netbeheer Nederland
                  </span>
                </p>
              </div>
            </div>

            {/* -------------------------------------- het antwoord */}
            <div className="mt-8 border-t border-kastwit/15 pt-8 lg:mt-10 lg:pt-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-12">
                <div>
                  <h2 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.05]">
                    Eén module.
                    <span className="accent"> Geen aansluiting.</span>
                  </h2>

                  <p className="mt-4 text-sm leading-relaxed text-kastwit/65">
                    Blusbox klikt op de DIN-rail naast je hoofdschakelaar en
                    aardlekschakelaar. Het detectiekoord doet de rest — tien
                    jaar lang, zonder stroom.
                  </p>

                  <p className="mt-4 text-base font-semibold leading-relaxed text-kastwit sm:text-lg">
                    Blusbox is wat er overblijft als het tóch misgaat: bij
                    170&nbsp;°C dooft de module de brand in de kast, zonder
                    stroom en zonder dat er iemand thuis hoeft te zijn.
                  </p>

                  <p className="mt-4 text-xs leading-relaxed text-kastwit/45">
                    Een blusmodule repareert geen verkeerd aangesloten groep.
                    Laat je installatie nakijken door iemand met zegelrecht —
                    dat is het advies in het artikel, en het onze ook.
                  </p>

                  <ButtonLink href="/blusbox" className="mt-6 rounded-full">
                    Bekijk Blusbox
                  </ButtonLink>
                </div>

                {/* Twee beelden naast elkaar, ook op een telefoon. Onder
                    elkaar zou dit blok een half scherm langer worden, en
                    juist dat moest eraf. */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <figure>
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-antraciet-verhoogd">
                      <Image
                        src="/media/module-packshot.webp"
                        alt="Blusbox-module: rode behuizing met DIN-railclip, twee blauwe detectiekoorden en pictogrammen met levensduur, dichtheid en activeringstemperatuur"
                        fill
                        sizes="(min-width: 1024px) 24vw, 45vw"
                        className="object-cover"
                      />
                      <LogoBadge />
                    </div>
                    <figcaption className="data px-0.5 pt-2 text-[11px] text-railstaal">
                      De module
                    </figcaption>
                  </figure>

                  <figure>
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-antraciet-verhoogd">
                      <VideoBlock
                        src="/media/klant/installatie.mp4"
                        poster="/media/klant/installatie.jpg"
                        label="Opname bij een klant: de module wordt op de DIN-rail geklikt, het detectiekoord wordt langs de groepen gelegd en de kast gaat dicht"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <LogoBadge />
                    </div>
                    <figcaption className="data px-0.5 pt-2 text-[11px] text-railstaal">
                      Bij een klant · echte opname
                    </figcaption>
                  </figure>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
