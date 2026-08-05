import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, SectionTitle } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Voor installateurs",
  description:
    "Het Blusbox-dealerprogramma: dealerprijzen, bulkbestellingen, een eigen register van geplaatste units en doorstuurbare vervangingsherinneringen.",
  alternates: { canonical: "/installateurs" },
};

const voordelen = [
  {
    nr: "01",
    t: "Dealerprijzen en staffels",
    b: "Prijzen exclusief btw, oplopende korting per staffel en levering op rekening na goedkeuring.",
  },
  {
    nr: "02",
    t: "Bulk bestellen",
    b: "Bestel per doos of per project. Bij elke levering krijgt u de lotnummers van de geleverde units mee.",
  },
  {
    nr: "03",
    t: "Uw eigen unitregister",
    b: "Registreer per klant en per adres welke module u heeft geplaatst en op welke datum. De vervangingsdatum wordt automatisch berekend.",
  },
  {
    nr: "04",
    t: "Doorstuurbare herinneringen",
    b: "Herinneringen op twaalf, zes en één maand voor het einde van de levensduur. U stuurt ze door naar uw klant, of laat ons dat doen.",
  },
  {
    nr: "05",
    t: "Verkoopmateriaal",
    b: "Productfoto's, de film, het productblad en de handleiding — klaar voor uw eigen offertes en website.",
  },
  {
    nr: "06",
    t: "Instructiemateriaal",
    b: "Korte montage-instructie voor uw monteurs, inclusief wat te doen na een activering.",
  },
];

export default function InstallateursPage() {
  return (
    <>
      <PageHeader
        eyebrow="dealerprogramma"
        title="U plaatst hem."
        accent="Wij houden bij tot wanneer."
        lead="Blusbox verkoopt zich in de meterkast, niet in de folder. Het dealerprogramma is opgezet rond het werk dat u toch al doet: plaatsen, registreren en over tien jaar vervangen."
      />
      <main>
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {voordelen.map((v, i) => (
              <Reveal key={v.nr} delay={i * 60}>
                <article className="h-full rounded-2xl border border-railstaal/50 p-8">
                  <p className="data text-xs text-staal-tekst">{v.nr}</p>
                  <h2 className="font-display mt-2 text-xl">{v.t}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-staal-tekst">
                    {v.b}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Aanmelden + inloggen */}
        <section className="bg-antraciet py-20 text-kastwit">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2">
            <div>
              <SectionTitle>Aanmelden</SectionTitle>
              <p className="mt-4 text-kastwit/70">
                Wij openen accounts voor installatiebedrijven met een geldige
                KvK-inschrijving. Na goedkeuring ziet u dealerprijzen in de
                webshop en krijgt u toegang tot uw unitregister.
              </p>
              <ul className="data mt-6 space-y-2 text-xs text-railstaal">
                <li>1. Aanvraag met KvK-nummer en btw-id</li>
                <li>2. Beoordeling binnen [VERIFY: doorlooptijd]</li>
                <li>3. Toegang tot dealerportaal en bestellen op rekening</li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="rounded-full bg-blusrood px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#b81e1b]"
                >
                  Account aanvragen
                </Link>
                <Link
                  href="/downloads"
                  className="rounded-full border border-kastwit/40 px-6 py-3 text-sm transition-colors hover:bg-kastwit hover:text-antraciet"
                >
                  Documentatie
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-kastwit/15 p-8">
              <h2 className="font-display text-2xl">Inloggen</h2>
              <p className="mt-3 text-sm text-kastwit/70">
                Heeft u al een dealeraccount? Het portaal met prijzen, bestellen
                en uw unitregister opent zodra de accountomgeving live gaat.
              </p>
              <div className="mt-6 space-y-3">
                <div>
                  <label
                    htmlFor="dealer-email"
                    className="data block text-xs text-railstaal"
                  >
                    E-mailadres
                  </label>
                  <input
                    id="dealer-email"
                    type="email"
                    autoComplete="email"
                    disabled
                    placeholder="naam@bedrijf.nl"
                    className="mt-1.5 w-full rounded-[var(--radius-control)] border border-kastwit/20 bg-transparent px-4 py-3 text-sm placeholder:text-kastwit/30 disabled:opacity-60"
                  />
                </div>
                <button
                  type="button"
                  disabled
                  className="w-full rounded-full border border-kastwit/40 px-6 py-3 text-sm disabled:opacity-60"
                >
                  Inlogkoppeling aanvragen
                </button>
                <p className="data text-[11px] text-railstaal">
                  Inloggen wordt geactiveerd bij oplevering van de
                  accountomgeving.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
