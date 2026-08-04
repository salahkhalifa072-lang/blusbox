import { ButtonLink } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { CrossSection } from "@/components/home/cross-section";

/**
 * §5.1 Home. Order: hero copy → scroll cross-section → hero film (placeholder
 * until §14 step 10) → "waarom de meterkast" four-panel → spec strip →
 * split CTA. laatste verdedigingslinie is the framing throughout.
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
        {/* Hero copy */}
        <section className="mx-auto max-w-6xl px-6 pb-8 pt-20 sm:pt-28">
          <h1 className="font-display max-w-4xl text-[length:var(--text-4xl)] leading-[0.95]">
            Als alles al is misgegaan,
            <br className="hidden sm:block" />
            grijpt Blusbox in.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-staal-tekst">
            Een compacte blusmodule in je meterkast die bij{" "}
            <span className="data text-antraciet">170 °C</span> vanzelf
            ingrijpt. Geen stroom. Geen bediening. Geen mens.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <ButtonLink href="/blusbox">Bekijk Blusbox</ButtonLink>
            <ButtonLink href="/installateurs" variant="secondary">
              Voor installateurs
            </ButtonLink>
          </div>
        </section>

        {/* Signature element — scroll cross-section */}
        <CrossSection />

        {/* Hero film — placeholder until §14 step 10 */}
        <section
          aria-label="Film"
          className="flex min-h-[60vh] items-center justify-center bg-antraciet"
        >
          <div className="px-6 py-24 text-center">
            <p className="data text-xs uppercase tracking-widest text-railstaal">
              film · 16:9 · stille loop
            </p>
            <p className="font-display mt-4 text-[length:var(--text-2xl)] text-kastwit">
              Er gebeurde niets.
            </p>
            <p className="data mt-4 text-xs text-railstaal">
              [hero-loop volgt — §7]
            </p>
          </div>
        </section>

        {/* Waarom de meterkast */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="font-display mb-12 max-w-2xl text-[length:var(--text-2xl)]">
            Waarom juist de meterkast?
          </h2>
          <div className="grid gap-px bg-railstaal sm:grid-cols-2">
            {panels.map((panel) => (
              <article key={panel.nr} className="bg-kastwit p-8">
                <p className="data text-xs text-staal-tekst">{panel.nr}</p>
                <h3 className="font-display mt-3 text-lg">{panel.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-staal-tekst">
                  {panel.body}
                </p>
              </article>
            ))}
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
