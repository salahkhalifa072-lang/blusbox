import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ScrollScrub } from "@/components/home/scroll-scrub";
import { VideoBlock } from "@/components/ui/video-block";
import { Reveal } from "@/components/ui/reveal";
import { LogoBadge } from "@/components/site/logo";
import { UspBar } from "@/components/site/usp-bar";
import { InDePraktijk } from "@/components/home/in-de-praktijk";
import { NieuwsEnModule } from "@/components/home/nieuws-en-module";
import { Partnerband } from "@/components/home/partnerband";
import { Prijsblok } from "@/components/product/prijsblok";
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
          Hero. De film is staand (9:16): een man klikt de module op de
          DIN-rail. Als liggende achtergrond achter de kop zou juist die klik
          worden weggesneden of onder de letters verdwijnen, dus de film
          krijgt op elk formaat een eigen vak.

          Mobiel: een blok boven de kop, uitgesneden op het gezicht, de module
          en beide koorden — je ziet eerst waar het over gaat en leest daarna
          waarom.

          Desktop: kop en tekst links, de film als staande kaart rechts. De
          tekst staat daardoor op effen antraciet en heeft geen schaduwlagen
          meer nodig om leesbaar te blijven.
        */}
        <section className="relative overflow-hidden bg-antraciet pt-32 lg:pt-0">
          <div className="relative mx-auto max-w-7xl lg:grid lg:min-h-screen lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12 lg:px-6 lg:pb-12 lg:pt-32">
            {/* De uitsnede houdt het gezicht, de module en beide koorden in
                beeld: 25% in het vierkant op mobiel, 34% in het lagere
                4:3-vak op tablet, anders valt het onderste koord weg. Op lg
                is het vak zelf staand en past de hele film erin. */}
            <div className="relative aspect-square w-full sm:aspect-[4/3] lg:order-2 lg:aspect-[9/16] lg:h-[min(76vh,46rem)] lg:w-auto lg:overflow-hidden lg:rounded-3xl lg:border lg:border-kastwit/10">
              <VideoBlock
                src="/media/hero-plaatsing.mp4"
                poster="/media/hero-plaatsing.jpg"
                label="Een man klikt de Blusbox-module in de meterkast op de DIN-rail, in lijn naast een installatieautomaat"
                className="absolute inset-0 h-full w-full object-cover object-[50%_25%] sm:object-[50%_34%] lg:object-center"
                priority
              />
            </div>

            <div className="relative flex flex-col gap-8 px-6 pb-10 pt-8 lg:order-1 lg:gap-2 lg:px-0 lg:pb-0 lg:pt-0">
              {/* top line */}
              <div>
                {/* One sentence over two blocks. The h1 carries the whole
                    line for assistive tech; the closing half is painted
                    below it and hidden from the accessibility tree. */}
                {/* leading-[1.05] tegen de 0.88 die .font-display meegeeft.
                    Die strakke zetting is gemaakt voor losse woorden onder
                    elkaar; met twee volle regels liepen de stokken van de
                    onderste regel tegen de staarten van de bovenste. */}
                {/* Op lg kleiner dan op mobiel: de kolom deelt de breedte
                    met de film, en "dé brandblusser" moet op één regel. */}
                <h1 className="font-display text-[clamp(2.75rem,9vw,7.5rem)] leading-[1.05] lg:text-[clamp(4rem,6.2vw,6.25rem)]">
                  <span aria-hidden className="text-blusrood-op-donker">
                    Blusbox,
                  </span>
                  <br aria-hidden />
                  <span aria-hidden className="text-kastwit">
                    dé brandblusser
                  </span>
                  <span className="sr-only">
                    Blusbox, dé brandblusser voor in de meterkast!
                  </span>
                </h1>
              </div>

              {/* bottom line + supporting copy */}
              <div>
                <p
                  aria-hidden
                  className="font-display text-[clamp(2.75rem,9vw,7.5rem)] leading-[1.05] lg:text-[clamp(4rem,6.2vw,6.25rem)]"
                >
                  <span className="text-kastwit">voor in de </span>
                  <span className="text-blusrood-op-donker">meterkast!</span>
                </p>

                <div className="mt-10 flex flex-col gap-8 border-t border-kastwit/15 pt-6">
                  <div className="max-w-md">
                    <p className="text-kastwit/75">
                      Een compacte blusmodule in je meterkast die bij{" "}
                      <span className="data text-kastwit">170 °C</span> vanzelf
                      ingrijpt. Geen stroom. Geen bediening. Geen mens.
                    </p>
                    {/* Prijs, adviesprijs en het verschil — hetzelfde blok als
                        op de productpagina, zodat de twee pagina's niet elk een
                        eigen voorstelling van de prijs geven.

                        De gevulde rode badge is nu het kortingscijfer en niet
                        meer de verzendbelofte. Twee gevulde badges naast elkaar
                        vechten om dezelfde aandacht, en van die twee is het
                        prijsverschil de reden om door te klikken; gratis
                        verzending staat bovendien in de balk erboven én in de
                        kaartenrij direct hieronder. */}
                    <div className="mt-5">
                      <Prijsblok />
                      <p className="data mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-kastwit/70">
                        <span>incl. btw · t.o.v. adviesprijs</span>
                        <span className="rounded-full border border-kastwit/30 px-3 py-1">
                          {gratisVerzending.kort}
                        </span>
                      </p>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href="/blusbox"
                        className="rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
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

                  {/* floating spec cards, reference pattern */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:max-w-xl">
                    {specs.map((s) => (
                      <div
                        key={s.label}
                        className="rounded-2xl border border-kastwit/15 bg-kastwit/5 px-4 py-3 backdrop-blur-sm"
                      >
                        <p className="data text-lg text-kastwit">{s.value}</p>
                        <p className="mt-0.5 text-[11px] leading-tight text-kastwit/60">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="data mt-4 text-[11px] text-railstaal">
                  Beeld is een weergave.
                </p>
              </div>
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

        {/* Module in de hand en in de kast, bij echte klanten. Staat na
            het gecombineerde blok hierboven: dat legt uit wat het is, dit
            laat zien hoe klein het is en waar het hangt. */}
        <InDePraktijk />

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
