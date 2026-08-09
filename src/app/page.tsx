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
        {/* Hero — product centred, headline split to the corners */}
        <section className="relative min-h-screen overflow-hidden bg-antraciet">
          <VideoBlock
            src="/media/hero-banner.mp4"
            poster="/media/hero-banner.jpg"
            label="Bewegend beeld van de Blusbox-module"
            className="absolute inset-0 h-full w-full object-cover"
            priority
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(22,24,26,0.35)_0%,rgba(22,24,26,0.8)_60%,var(--antraciet)_100%)]"
            aria-hidden
          />
          {/* keeps the body copy and cards legible over the bright render */}
          <div
            className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-antraciet via-antraciet/85 to-transparent"
            aria-hidden
          />

          <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-6 pb-10 pt-28 sm:pt-32">
            {/* top line */}
            <div>
              {/* One sentence, split around the product. The h1 carries the
                  whole line for assistive tech; the closing half is painted
                  below the module and hidden from the accessibility tree. */}
              <h1 className="font-display text-[clamp(2.75rem,9vw,7.5rem)]">
                <span aria-hidden className="accent">
                  Als alles
                </span>
                <br aria-hidden />
                <span aria-hidden className="text-kastwit">
                  al is misgegaan
                </span>
                <span className="sr-only">
                  Als alles al is misgegaan, grijpt Blusbox in.
                </span>
              </h1>
            </div>

            {/* the film itself carries the centre of the frame */}

            {/* bottom line + supporting copy */}
            <div>
              <p
                aria-hidden
                className="font-display text-right text-[clamp(2.75rem,9vw,7.5rem)]"
              >
                <span className="text-kastwit">grijpt </span>
                <span className="accent">Blusbox in</span>
              </p>

              <div className="mt-10 flex flex-col gap-8 border-t border-kastwit/15 pt-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-md">
                  <p className="text-kastwit/75">
                    Een compacte blusmodule in je meterkast die bij{" "}
                    <span className="data text-kastwit">170 °C</span> vanzelf
                    ingrijpt. Geen stroom. Geen bediening. Geen mens.
                  </p>
                  <p className="data mt-5 text-sm text-kastwit">
                    {prijsIncl}{" "}
                    <span className="text-kastwit/50">incl. btw</span>
                    <span className="mx-2 text-kastwit/30">·</span>
                    <span className="text-blusrood-op-donker">
                      {gratisVerzending.kort}
                    </span>
                  </p>
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

        {/* Product imagery */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <h2 className="font-display max-w-3xl text-[clamp(2rem,5vw,3.5rem)]">
              Eén module.
              <span className="accent-dim"> Geen aansluiting.</span>
            </h2>
            <p className="mt-4 max-w-xl text-staal-tekst">
              Blusbox klikt op de DIN-rail naast je hoofdschakelaar en
              aardlekschakelaar. Het detectiekoord doet de rest — tien jaar
              lang, zonder stroom.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <Reveal>
              <figure>
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-kastwit-dim">
                  <Image
                    src="/media/packshot.jpg"
                    alt="Blusbox module, matrood, met DIN-railclip en detectiekoord"
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover"
                  />
                  <LogoBadge />
                </div>
                <figcaption className="data px-1 py-3 text-xs text-staal-tekst">
                  De module
                </figcaption>
              </figure>
            </Reveal>
            <Reveal delay={80} className="sm:col-span-2">
              <figure>
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-kastwit-dim sm:aspect-auto sm:h-full">
                  <VideoBlock
                    src="/media/meterkast-front.mp4"
                    poster="/media/meterkast-front.jpg"
                    label="Fragment: een beginnende brand in de meterkast wordt door de Blusbox-module met aerosol gedoofd"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <LogoBadge />
                </div>
                <figcaption className="data px-1 py-3 text-xs text-staal-tekst">
                  In de meterkast · beeld is een weergave
                </figcaption>
              </figure>
            </Reveal>
          </div>
          <div className="mt-8">
            <ButtonLink href="/blusbox" className="rounded-full">
              Bekijk Blusbox
            </ButtonLink>
          </div>
        </section>

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
                    "Detectiekoord, voorgemonteerd",
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
                      alt="Geopende Blusbox-verpakking met de module, het detectiekoord en de handleiding in schuimuitsparingen"
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
