import type { Metadata } from "next";
import { Button, ButtonLink } from "@/components/ui/button";
import { SpecTable } from "@/components/ui/spec-table";
import { ClaimSource } from "@/components/ui/claim-source";
import { productFacts } from "@/lib/product-facts";

export const metadata: Metadata = {
  title: "Designsysteem",
  robots: { index: false },
};

const swatches = [
  { name: "--kastwit", hex: "#E8E9E6", role: "paginagrond — polycarbonaat" },
  { name: "--railstaal", hex: "#9BA1A6", role: "lijnen en randen, nooit tekst" },
  { name: "--antraciet", hex: "#16181A", role: "tekst, donkere secties" },
  { name: "--blusrood", hex: "#D2231F", role: "de module en één primaire actie" },
  { name: "--signaal", hex: "#F4C300", role: "alleen het 170 °C-moment" },
  { name: "--staal-tekst", hex: "#595F63", role: "gedempte tekst (AA-veilig)" },
];

function SectionLabel({ nr, title }: { nr: string; title: string }) {
  return (
    <div className="hairline-b mb-8 flex items-baseline justify-between pb-2">
      <h2 className="font-display text-xl">{title}</h2>
      <span className="data text-xs text-staal-tekst">{nr}</span>
    </div>
  );
}

export default function DesignPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-16">
        <p className="data text-xs text-staal-tekst">intern · niet geïndexeerd</p>
        <h1 className="font-display mt-2 text-[length:var(--text-2xl)]">
          Blusbox designsysteem
        </h1>
        <p className="mt-4 max-w-xl text-staal-tekst">
          Referentiewereld: Nederlands/Zwitsers industrieel drukwerk en
          ISO-signalering, toegepast op de materialen van een meterkast.
          Rood verschijnt één keer per scherm.
        </p>
      </header>

      {/* Palette */}
      <section className="mb-20">
        <SectionLabel nr="01" title="Kleur" />
        <div className="grid grid-cols-2 gap-px bg-railstaal sm:grid-cols-3">
          {swatches.map((s) => (
            <div key={s.name} className="bg-kastwit p-4">
              <div
                className="hairline mb-3 h-16"
                style={{ backgroundColor: s.hex }}
                aria-hidden
              />
              <p className="data text-xs">{s.name}</p>
              <p className="data text-xs text-staal-tekst">{s.hex}</p>
              <p className="mt-1 text-xs text-staal-tekst">{s.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Type */}
      <section className="mb-20">
        <SectionLabel nr="02" title="Typografie" />
        <div className="space-y-8">
          <div>
            <p className="data mb-2 text-xs text-staal-tekst">
              Archivo Expanded 700 · display · clamp 40–96
            </p>
            <p className="font-display text-[length:var(--text-4xl)] leading-none">
              Er gebeurde niets.
            </p>
          </div>
          <div>
            <p className="data mb-2 text-xs text-staal-tekst">
              Instrument Sans 400/500 · lopende tekst · 16/20
            </p>
            <p className="max-w-xl text-lg">
              Een compacte blusmodule in je meterkast die bij 170 °C vanzelf
              ingrijpt. Geen stroom. Geen bediening. Geen mens.
            </p>
          </div>
          <div>
            <p className="data mb-2 text-xs text-staal-tekst">
              Geist Mono · elke meetbare waarde
            </p>
            <p className="data text-xl">
              170 °C · 100 g/m³ · 10 jaar · LOT 2026-08-A
            </p>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="mb-20">
        <SectionLabel nr="03" title="Bediening" />
        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink href="/blusbox">Bekijk Blusbox</ButtonLink>
          <Button variant="secondary">Voor installateurs</Button>
          <Button variant="ghost">Download productblad</Button>
        </div>
        <p className="mt-4 max-w-xl text-sm text-staal-tekst">
          Eén primaire (rode) knop per scherm. Hoekradius 2 px, uitsluitend op
          interactieve elementen — al het andere is 0.
        </p>
      </section>

      {/* Spec table + claim source */}
      <section className="mb-20">
        <SectionLabel nr="04" title="Specificaties" />
        <SpecTable rows={productFacts} caption="Blusbox module" />
        <ClaimSource label="[VERIFY: conformiteitsdocument koppelen]" />
      </section>

      {/* Grid */}
      <section>
        <SectionLabel nr="05" title="Raster" />
        <div className="din-grid">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className={`h-16 bg-kastwit-dim ${i > 7 ? "hidden lg:block" : ""}`}
            />
          ))}
        </div>
        <p className="data mt-3 text-xs text-staal-tekst">
          8 kolommen mobiel · 18 kolommen desktop · afgeleid van DIN-steek
        </p>
      </section>
    </main>
  );
}
