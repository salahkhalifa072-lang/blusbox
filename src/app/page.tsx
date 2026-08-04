import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { CrossSection } from "@/components/home/cross-section";
import { VideoBlock } from "@/components/ui/video-block";
import { Reveal } from "@/components/ui/reveal";

/**
 * §5.1 Home, video-first variant. Order: full-bleed film hero (canyon loop)
 * → scroll cross-section → product imagery → "Er gebeurde niets." film block
 * → activation clip → waarom-de-meterkast → spec strip → split CTA.
 * All dramatised footage carries "Beeld is een weergave." (§7.9).
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
        {/* Film hero — the canyon loop under the copy */}
        <section className="relative min-h-[88vh] overflow-hidden bg-antraciet">
          <VideoBlock
            src="/media/hero-loop.mp4"
            poster="/media/canyon.jpg"
            label="Filmische opname door een meterkast, gefilmd als industrieel landschap"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            priority
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-antraciet via-antraciet/40 to-antraciet/20"
            aria-hidden
          />
          <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-6 pb-16 pt-28">
            <p className="data mb-4 text-xs uppercase tracking-widest text-railstaal">
              binnenin je meterkast
            </p>
            <h1 className="font-display max-w-4xl text-balance text-[length:var(--text-4xl)] leading-[0.95] text-kastwit">
              Als alles al is misgegaan, grijpt Blusbox in.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-kastwit/80">
              Een compacte blusmodule in je meterkast die bij{" "}
              <span className="data text-kastwit">170 °C</span> vanzelf
              ingrijpt. Geen stroom. Geen bediening. Geen mens.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <ButtonLink href="/blusbox">Bekijk Blusbox</ButtonLink>
              <ButtonLink
                href="/installateurs"
                variant="secondary"
                className="border-kastwit text-kastwit hover:bg-kastwit hover:text-antraciet"
              >
                Voor installateurs
              </ButtonLink>
            </div>
            <div className="data mt-12 flex flex-wrap gap-x-8 gap-y-2 border-t border-kastwit/20 pt-4 text-xs text-railstaal">
              {specs.map((s) => (
                <span key={s.label}>
                  <span className="text-kastwit">{s.value}</span> {s.label}
                </span>
              ))}
              <span className="ml-auto">Beeld is een weergave.</span>
            </div>
          </div>
        </section>

        {/* Signature element — scroll cross-section */}
        <CrossSection />

        {/* Product imagery */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <h2 className="font-display max-w-2xl text-[length:var(--text-2xl)]">
              Eén module. Geen aansluiting.
            </h2>
            <p className="mt-4 max-w-xl text-staal-tekst">
              Blusbox klikt op de DIN-rail naast je hoofdschakelaar en
              aardlekschakelaar. Het detectiekoord doet de rest — tien jaar
              lang, zonder stroom.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-px bg-railstaal sm:grid-cols-3">
            {[
              {
                src: "/media/packshot.jpg",
                alt: "Blusbox module, matrood, met DIN-railclip en detectiekoord",
                caption: "De module",
                delay: 0,
              },
              {
                src: "/media/insitu.jpg",
                alt: "Blusbox gemonteerd op de DIN-rail in een Nederlandse meterkast naast de automaten",
                caption: "Op de rail, naast de automaten",
                delay: 80,
              },
            ].map((img) => (
              <Reveal key={img.src} delay={img.delay} className="bg-kastwit">
                <figure>
                  <div className="relative aspect-square overflow-hidden bg-kastwit-dim">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="data px-4 py-3 text-xs text-staal-tekst">
                    {img.caption}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
            <Reveal delay={160} className="bg-kastwit">
              <figure>
                <div className="relative aspect-square overflow-hidden bg-kastwit-dim">
                  <VideoBlock
                    src="/media/monolith.mp4"
                    poster="/media/monolith.jpg"
                    label="Filmfragment: langzame beweging rond de rode module tussen grijze installatietorens"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <figcaption className="data px-4 py-3 text-xs text-staal-tekst">
                  Uit de film · beeld is een weergave
                </figcaption>
              </figure>
            </Reveal>
          </div>
          <div className="mt-8">
            <ButtonLink href="/blusbox">Bekijk Blusbox</ButtonLink>
          </div>
        </section>

        {/* Er gebeurde niets — film block */}
        <section className="bg-antraciet py-24 text-kastwit">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <p className="data text-xs uppercase tracking-widest text-railstaal">
                de film
              </p>
              <h2 className="font-display mt-4 text-[length:var(--text-3xl)]">
                Er gebeurde niets.
              </h2>
              <p className="mt-4 max-w-xl text-kastwit/70">
                Dertig centimeter meterkast, gefilmd als een landschap. Eén
                verbinding begeeft het. Bij 170 °C grijpt Blusbox in — en
                &apos;s ochtends zet je gewoon koffie.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              <Reveal className="lg:col-span-2">
                <figure>
                  <VideoBlock
                    src="/media/discharge.mp4"
                    poster="/media/discharge.jpg"
                    label="Filmfragment: een witte aerosolfront rolt door het industriële landschap en dooft het vuurgloed"
                    className="aspect-video w-full object-cover"
                  />
                  <figcaption className="data mt-3 text-xs text-railstaal">
                    De onderdrukking · beeld is een weergave
                  </figcaption>
                </figure>
              </Reveal>
              <Reveal delay={100}>
                <figure>
                  <div className="relative aspect-video w-full overflow-hidden lg:aspect-auto lg:h-full lg:min-h-[200px]">
                    <Image
                      src="/media/hallway.jpg"
                      alt="Gewone Nederlandse gang in ochtendlicht met gesloten meterkastdeur"
                      fill
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="data mt-3 text-xs text-railstaal">
                    07:12 · en je weet van niets
                  </figcaption>
                </figure>
              </Reveal>
            </div>
          </div>
        </section>

        {/* De activering — in-cabinet clip */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="data text-xs uppercase tracking-widest text-staal-tekst">
                de activering
              </p>
              <h2 className="font-display mt-4 text-[length:var(--text-2xl)]">
                Van vlam tot stilte,
                <br />
                zonder één handeling.
              </h2>
              <p className="mt-4 max-w-md text-staal-tekst">
                Een losse verbinding, een beginnende vlam. Het detectiekoord
                bereikt 170 °C en de module vult de kast met aerosol. De vlam
                dooft, de installatie blijft intact — en niemand hoefde iets
                te doen.
              </p>
              <p className="data mt-6 text-xs text-staal-tekst">
                Beeld is een weergave.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <VideoBlock
                src="/media/activation.mp4"
                poster="/media/insitu.jpg"
                label="Fragment: een beginnende vlam in de meterkast wordt door de Blusbox-module met aerosol gedoofd"
                className="aspect-[4/3] w-full object-cover"
              />
            </Reveal>
          </div>
        </section>

        {/* Waarom de meterkast */}
        <section className="hairline-t">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal>
              <h2 className="font-display mb-12 max-w-2xl text-[length:var(--text-2xl)]">
                Waarom juist de meterkast?
              </h2>
            </Reveal>
            <div className="grid gap-px bg-railstaal sm:grid-cols-2">
              {panels.map((panel, i) => (
                <Reveal key={panel.nr} delay={i * 70} className="bg-kastwit">
                  <article className="h-full p-8">
                    <p className="data text-xs text-staal-tekst">{panel.nr}</p>
                    <h3 className="font-display mt-3 text-lg">{panel.title}</h3>
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
              <h2 className="font-display mt-4 text-[length:var(--text-xl)]">
                Eén module. Tien jaar rust.
              </h2>
              <p className="mt-3 max-w-sm text-sm text-staal-tekst">
                Past in de standaard Nederlandse meterkast, naast de
                hoofdschakelaar en de aardlekschakelaar.
              </p>
            </div>
            <ButtonLink href="/blusbox">Bekijk Blusbox</ButtonLink>
          </div>
          <div className="flex flex-col items-start justify-between gap-8 bg-antraciet p-10 text-kastwit sm:p-16">
            <div>
              <p className="data text-xs uppercase tracking-widest text-railstaal">
                zakelijk
              </p>
              <h2 className="font-display mt-4 text-[length:var(--text-xl)]">
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
              className="border-kastwit text-kastwit hover:bg-kastwit hover:text-antraciet"
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
