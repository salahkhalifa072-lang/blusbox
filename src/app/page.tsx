import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ScrollScrub } from "@/components/home/scroll-scrub";
import { Reveal } from "@/components/ui/reveal";
import { LogoBadge } from "@/components/site/logo";
import { UspBar } from "@/components/site/usp-bar";
import { HeroExplosie } from "@/components/home/hero-explosie";
import { HeroTekst } from "@/components/home/hero-tekst";
import { NieuwsEnModule } from "@/components/home/nieuws-en-module";
import { Partnerband } from "@/components/home/partnerband";
import { Reviews } from "@/components/reviews/reviews";
import { gratisVerzending, prijsIncl, verzendwaarde } from "@/lib/pricing";
import { VerpakkingZweeft } from "@/components/home/verpakking-zweeft";
import { ZoWerktHet } from "@/components/home/zo-werkt-het";
import { HomepageVragen } from "@/components/home/homepage-vragen";
import { SlotCta } from "@/components/home/slot-cta";
import { MobieleKoopbalk } from "@/components/home/mobiele-koopbalk";
import { SectieLabel } from "@/components/ui/sectielabel";

/**
 * §5.1 Home. Layout follows the client's reference: dark full-bleed hero with
 * the product centred, two-tone condensed headline split to the corners,
 * floating info cards, then the scroll-scrubbed meterkast sequence.
 */

const panels = [
  {
    nr: "01",
    title: "Alles komt hier samen",
    body: "Elke groep, de hoofdschakelaar, de aardlekschakelaar: de hele installatie loopt door één kleine kast. Wat hier misgaat, raakt het hele huis.",
  },
  {
    nr: "02",
    title: "Een gesloten volume",
    body: "Een meterkast is een afgesloten behuizing. Precies de omgeving waarvoor condensed-aerosol brandonderdrukking is ontworpen.",
  },
  {
    nr: "03",
    title: "Niemand houdt de wacht",
    body: "Een beginnende kastbrand kondigt zich niet aan. Blusbox activeert zichzelf bij 170 °C — zonder stroom, zonder bediening, zonder mens.",
  },
  {
    nr: "04",
    title: "Na de laatste controle",
    body: "Installatie, inspectie, aardlekschakelaar: allemaal lagen die eerder komen. Blusbox is de laag die ingrijpt als al die lagen al zijn gepasseerd.",
  },
];


export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        {/*
          Hero: de module als explosietekening. Hij springt open op een fijn
          raster — het tekenpapier van een technische tekening — en op het
          uiteengevallen moment benoemen verwijskaartjes de onderdelen.
          Het raster vervaagt naar de randen zodat het achter de module
          staat en niet achter de tekst.
        */}
        <section className="relative overflow-hidden bg-antraciet pt-24 lg:pt-0">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(232,233,230,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(232,233,230,0.05)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent)] lg:[mask-image:radial-gradient(ellipse_45%_70%_at_72%_50%,black,transparent)]"
          />
          <div className="relative mx-auto max-w-7xl lg:grid lg:min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-8 lg:px-6 lg:pt-28">
            <div className="px-2 lg:order-2 lg:px-0">
              <HeroExplosie />
            </div>
            <div className="mt-2 lg:order-1 lg:mt-0">
              <HeroTekst />
            </div>
          </div>
        </section>

        {/* Trust row directly under the hero, webshop convention */}
        <UspBar />

        {/* Hoe het in vier stappen gaat, vóór het verhaal over de brand:
            eerst het gedoe wegnemen, dan laten zien wat het doet. */}
        <ZoWerktHet />

        {/* Signature element — scroll-scrubbed real footage */}
        <ScrollScrub />

        {/* Wat je ziet, uitgelegd */}
        <section className="bg-antraciet pb-14 text-kastwit sm:pb-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2">
            <Reveal>
              <SectieLabel donker>wat je ziet</SectieLabel>
              <h2 className="font-display mt-4 text-[clamp(2rem,5vw,3.5rem)]">
                Van vlam tot stilte,
                <br />
                <span className="accent">zonder één handeling</span>
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <p className="text-kastwit/70">
                Een losse verbinding gaat gloeien. De warmte loopt op tot het
                detectiekoord 170 °C bereikt — dan activeert de module zichzelf
                en vult de kast met aerosol. De vlam dooft, het residu is
                niet-geleidend en niet-corrosief, en de installatie blijft
                intact.
              </p>
              <p className="data mt-6 text-xs text-railstaal">
                Beeld is een weergave.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Het nieuwsbericht en het product in één blok: dit is het
            probleem, dit is wat wij eraan doen. Uit elkaar namen ze bijna
            twee schermen voor één gedachte. */}
        <NieuwsEnModule />


        {/* What arrives on the doormat. Sits here on purpose: it follows the
            product and carries the shipping promise into the buying moment. */}
        <section className="bg-kastwit-dim py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-center lg:gap-12">
              <Reveal>
                <SectieLabel>in de doos</SectieLabel>
                <h2 className="font-display mt-4 text-[clamp(2rem,5vw,3.5rem)]">
                  Alles erin.
                  <span className="accent"> Verzending gratis.</span>
                </h2>
                <p className="mt-4 max-w-md text-staal-tekst">
                  De module, het voorgemonteerde detectiekoord en een
                  Nederlandse handleiding — plus de registratiekaart met het
                  lotnummer van jouw unit. Meer heb je niet nodig.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-staal-tekst">
                  {[
                    "Blusbox-module met DIN-railclip",
                    "Detectiekoord, al aangesloten op de module",
                    "Handleiding in het Nederlands",
                    "Registratiekaart met lotnummer",
                  ].map((r) => (
                    <li key={r} className="flex gap-3">
                      <span className="data text-blusrood-op-licht" aria-hidden>
                        —
                      </span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
                <p className="data mt-6 text-xs text-staal-tekst">
                  {gratisVerzending.kort} · t.w.v. {verzendwaarde}
                </p>
              </Reveal>

              <Reveal delay={100}>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Geen kader: de doos zweeft vrij boven de pagina. */}
                  <div className="relative aspect-square">
                    <VerpakkingZweeft />
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-3xl">
                    <Image
                      src="/media/verpakking-achterkant.jpg"
                      alt="Achterkant van de Blusbox-doos: zo werkt Blusbox in drie stappen, technische gegevens, inhoud en waarschuwingen"
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* In huis: je merkt er niets van */}
        <section className="bg-antraciet py-14 text-kastwit sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <SectieLabel donker>in huis</SectieLabel>
              <h2 className="font-display mt-4 text-[clamp(2.5rem,7vw,5.5rem)]">
                Je merkt er <span className="accent">niets</span> van
              </h2>
              <p className="mt-4 max-w-xl text-kastwit/70">
                Eén keer op de DIN-rail klikken, deur dicht en klaar. Blusbox
                vraagt geen stroom en geen onderhoud. Gaat er &apos;s nachts een
                verbinding mis, dan grijpt hij bij 170 °C zelf in — en
                &apos;s ochtends loop je gewoon de gang door.
              </p>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:mt-12 lg:grid-cols-3">
              <Reveal className="lg:col-span-2">
                <figure>
                  <div className="relative overflow-hidden rounded-2xl">
                    <Image
                      src="/media/man-met-blusbox-en-doos.webp"
                      alt="Man bij zijn open meterkast met in de ene hand de rode Blusbox-module en in de andere hand de rode Blusbox-verpakking"
                      width={1920}
                      height={1086}
                      sizes="(min-width: 1024px) 66vw, 100vw"
                      className="aspect-video w-full object-cover"
                    />
                    <LogoBadge />
                  </div>
                  <figcaption className="data mt-3 text-xs text-railstaal">
                    Blusbox in huis · beeld is een weergave
                  </figcaption>
                </figure>
              </Reveal>
              <Reveal delay={100} className="lg:h-full">
                <figure className="flex h-full flex-col">
                  {/* fills the column height beside the video without a
                      calc() against an auto-height parent */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl lg:aspect-auto lg:min-h-0 lg:flex-1">
                    <Image
                      src="/media/hallway.jpg"
                      alt="Gewone Nederlandse gang in ochtendlicht met gesloten meterkastdeur"
                      fill
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      className="object-cover"
                    />
                    <LogoBadge />
                  </div>
                  <figcaption className="data mt-3 text-xs text-railstaal">
                    07:12 · en je weet van niets
                  </figcaption>
                </figure>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Beoordelingen. Toont zichzelf niet zolang lib/reviews.ts leeg is. */}
        <Reviews />

        {/* Waarom de meterkast */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-14 sm:py-24">
            <Reveal>
              <SectieLabel>waarom</SectieLabel>
              <h2 className="font-display mb-8 mt-4 max-w-2xl text-[clamp(2rem,5vw,3.5rem)] sm:mb-12">
                Waarom juist <span className="accent">de meterkast</span>
              </h2>
            </Reveal>
            {/* Op een telefoon een veegrij, zoals de stappen erboven. */}
            <div className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0">
              {panels.map((panel, i) => (
                <Reveal key={panel.nr} delay={i * 70} className="w-[78%] shrink-0 snap-start sm:w-auto">
                  <article className="h-full rounded-3xl bg-kastwit-dim p-6 sm:p-8">
                    <p className="data text-xs text-staal-tekst">{panel.nr}</p>
                    <h3 className="font-display mt-3 text-xl sm:text-2xl">
                      {panel.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-staal-tekst">
                      {panel.body}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
            {/* Links met de zoekterm als tekst: zo weet Google waar die
                pagina's over gaan, en bezoekers kunnen verder lezen. */}
            <ul className="mt-8 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:gap-x-8">
              <li>
                <Link href="/meterkastbrand" className="underline underline-offset-4 hover:text-blusrood-op-licht">
                  Brand in de meterkast: oorzaken en signalen →
                </Link>
              </li>
              <li>
                <Link href="/kennisbank/welke-brandblusser-meterkast" className="underline underline-offset-4 hover:text-blusrood-op-licht">
                  Welke brandblusser past bij de meterkast? →
                </Link>
              </li>
              <li>
                <Link href="/kennisbank/meterkast-uitgelegd" className="underline underline-offset-4 hover:text-blusrood-op-licht">
                  De meterkast uitgelegd →
                </Link>
              </li>
            </ul>
          </div>
        </section>

        {/* De koopvragen, vlak voor het slot: wie hier nog twijfelt,
            twijfelt over iets dat een antwoord heeft. */}
        <div className="hairline-t">
          <HomepageVragen />
        </div>

        {/* Partnerprogramma. Onderaan en smal: dit is niet waarvoor
            iemand de site bezoekt, en bovenaan zou het concurreren met de
            bestelknop. */}
        <Partnerband />

        {/* Het slot: prijs en knop nog één keer, met de zakelijke route
            als regel eronder. */}
        <div className="pt-3 sm:pt-4">
          <SlotCta />
        </div>
      </main>
      <SiteFooter />
      <MobieleKoopbalk prijs={prijsIncl} regel={gratisVerzending.kort} />
    </>
  );
}
