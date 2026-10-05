import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ScrollScrub } from "@/components/home/scroll-scrub";
import { VideoBlock } from "@/components/ui/video-block";
import { Reveal } from "@/components/ui/reveal";
import { LogoBadge } from "@/components/site/logo";
import { UspBar } from "@/components/site/usp-bar";
import { HeroExplosie } from "@/components/home/hero-explosie";
import { HeroTekst } from "@/components/home/hero-tekst";
import { NieuwsEnModule } from "@/components/home/nieuws-en-module";
import { Partnerband } from "@/components/home/partnerband";
import { Reviews } from "@/components/reviews/reviews";
import { gratisVerzending, prijsIncl, verzendwaarde } from "@/lib/pricing";

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

const specs = [
  { value: "170 °C", label: "zelfactiverend" },
  { value: "0 W", label: "geen stroom nodig" },
  { value: "100 g/m³", label: "ontwerpdichtheid" },
  { value: "10 jaar", label: "levensduur" },
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
        <section className="relative overflow-hidden bg-antraciet pt-32 lg:pt-0">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(232,233,230,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(232,233,230,0.05)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent)] lg:[mask-image:radial-gradient(ellipse_45%_70%_at_72%_50%,black,transparent)]"
          />
          <div className="relative mx-auto max-w-7xl lg:grid lg:min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-8 lg:px-6 lg:pt-28">
            <div className="px-2 lg:order-2 lg:px-0">
              <HeroExplosie />
            </div>
            <div className="mt-8 lg:order-1 lg:mt-0">
              <HeroTekst />
            </div>
          </div>
        </section>

        {/* Trust row directly under the hero, webshop convention */}
        <UspBar />

        {/* Signature element — scroll-scrubbed real footage */}
        <ScrollScrub />

        {/* Wat je ziet, uitgelegd */}
        <section className="bg-antraciet pb-24 text-kastwit">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2">
            <Reveal>
              <p className="data text-xs uppercase tracking-widest text-railstaal">
                wat je ziet
              </p>
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
        <section className="bg-kastwit-dim py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-center">
              <Reveal>
                <p className="data text-xs uppercase tracking-widest text-staal-tekst">
                  in de doos
                </p>
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="relative aspect-square overflow-hidden rounded-2xl">
                    <Image
                      src="/media/verpakking-dicht.jpg"
                      alt="Gesloten rode Blusbox-verpakking met het logo en de tekst blusmodule voor de meterkast"
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-2xl">
                    <Image
                      src="/media/verpakking-open.jpg"
                      alt="Geopende Blusbox-verpakking: de module met vastzittend lichtblauw detectiekoord, naast een rode kaart met het Blusbox-logo"
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

        {/* Er gebeurde niets — film block */}
        <section className="bg-antraciet py-24 text-kastwit">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <p className="data text-xs uppercase tracking-widest text-railstaal">
                de film
              </p>
              <h2 className="font-display mt-4 text-[clamp(2.5rem,7vw,5.5rem)]">
                Er gebeurde <span className="accent">niets</span>
              </h2>
              <p className="mt-4 max-w-xl text-kastwit/70">
                Dertig centimeter meterkast, gefilmd als een landschap. Eén
                verbinding begeeft het. Bij 170 °C grijpt Blusbox in — en
                &apos;s ochtends zet je gewoon koffie.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              <Reveal className="lg:col-span-2">
                <figure>
                  <div className="relative overflow-hidden rounded-2xl">
                    <VideoBlock
                      src="/media/discharge.mp4"
            av1Src="/media/discharge.av1.mp4"
                      poster="/media/discharge.jpg"
                      label="Filmfragment: een wit aerosolfront rolt door het industriële landschap en dooft de vuurgloed"
                      className="aspect-video w-full object-cover"
                    />
                    <LogoBadge />
                  </div>
                  <figcaption className="data mt-3 text-xs text-railstaal">
                    De onderdrukking · beeld is een weergave
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
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal>
              <h2 className="font-display mb-12 max-w-2xl text-[clamp(2rem,5vw,3.5rem)]">
                Waarom juist <span className="accent">de meterkast</span>
              </h2>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2">
              {panels.map((panel, i) => (
                <Reveal key={panel.nr} delay={i * 70}>
                  <article className="h-full rounded-2xl border border-railstaal/50 p-8">
                    <p className="data text-xs text-staal-tekst">{panel.nr}</p>
                    <h3 className="font-display mt-3 text-2xl">
                      {panel.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-staal-tekst">
                      {panel.body}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Partnerprogramma. Onderaan en smal: dit is niet waarvoor
            iemand de site bezoekt, en bovenaan zou het concurreren met de
            bestelknop. */}
        <Partnerband />

        {/* Spec strip */}
        <section aria-label="Kerngegevens" className="hairline-t hairline-b">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px sm:grid-cols-4">
            {specs.map((spec) => (
              <div key={spec.label} className="px-6 py-10 text-center">
                <p className="data text-xl">{spec.value}</p>
                <p className="mt-1 text-xs text-staal-tekst">{spec.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Split CTA */}
        <section className="grid sm:grid-cols-2">
          <div className="flex flex-col items-start justify-between gap-8 bg-kastwit p-10 sm:p-16">
            <div>
              <p className="data text-xs uppercase tracking-widest text-staal-tekst">
                particulier
              </p>
              <h2 className="font-display mt-4 text-3xl">
                Eén module. Tien jaar rust.
              </h2>
              <p className="mt-3 max-w-sm text-sm text-staal-tekst">
                Past in de standaard Nederlandse meterkast, naast de
                hoofdschakelaar en de aardlekschakelaar.
              </p>
              <p className="data mt-5 text-lg">
                {prijsIncl}{" "}
                <span className="text-sm text-staal-tekst">incl. btw</span>
              </p>
              <p className="data mt-1 text-xs text-staal-tekst">
                Verzendkosten <span className="line-through">{verzendwaarde}</span>{" "}
                <span className="text-blusrood-op-licht">gratis</span>
              </p>
            </div>
            <ButtonLink href="/blusbox" className="rounded-full">
              Bekijk Blusbox
            </ButtonLink>
          </div>
          <div className="flex flex-col items-start justify-between gap-8 bg-antraciet p-10 text-kastwit sm:p-16">
            <div>
              <p className="data text-xs uppercase tracking-widest text-railstaal">
                zakelijk
              </p>
              <h2 className="font-display mt-4 text-3xl">
                Blusbox in uw RI&amp;E
              </h2>
              <p className="mt-3 max-w-sm text-sm text-kastwit/70">
                Voor installateurs, VvE&apos;s, woningcorporaties en
                KAM-beheer: staffelprijzen, levering op rekening.
              </p>
            </div>
            <ButtonLink
              href="/zakelijk"
              variant="secondary"
              className="rounded-full border-kastwit text-kastwit hover:bg-kastwit hover:text-antraciet"
            >
              Naar zakelijk
            </ButtonLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
