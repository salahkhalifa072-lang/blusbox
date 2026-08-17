import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, SectionTitle } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Over ons",
  description:
    "Waarom Blusbox bestaat: één maatregel voor het gat tussen preventie en de brandweer, gebouwd vanuit de praktijk van veiligheidskunde.",
  alternates: { canonical: "/over-ons" },
};

export default function OverOnsPage() {
  return (
    <>
      <PageHeader
        eyebrow="over ons"
        title="Wij verkopen"
        accent="het uitblijven van nieuws."
        lead="Blusbox is er voor het moment dat niemand meemaakt: een beginnende brand in een meterkast die dooft voordat iemand hem opmerkt."
      />
      <main>
        <section className="mx-auto max-w-3xl px-6 py-20">
          <Reveal>
            <div className="space-y-5 text-staal-tekst">
              <p>
                Bijna alles in brandveiligheid gaat over twee momenten: het
                voorkomen dat er brand ontstaat, en het bestrijden van brand die
                er al is. Tussen die twee zit een gat van een paar minuten,
                meestal &apos;s nachts, in een gesloten kast waar niemand naar
                kijkt.
              </p>
              <p>
                In die minuten helpt geen inspectie meer en is de brandweer nog
                niet gebeld. De enige maatregel die dan nog iets kan doen, is een
                maatregel die al in de kast zit en niemand nodig heeft om te
                werken. Dat is het hele idee achter Blusbox.
              </p>
              <p>
                Wij hebben de module niet uitgevonden — condensed-aerosol
                brandonderdrukking bestaat al langer in industriële toepassingen.
                Wat wij doen is hem geschikt maken voor de Nederlandse
                meterkast, in het Nederlands documenteren, en er de
                administratie omheen bouwen die deze productcategorie eigenlijk
                vereist: welk lot waar hangt, en tot wanneer.
              </p>
            </div>
          </Reveal>
        </section>

        <section className="bg-kastwit-dim py-20">
          <div className="mx-auto max-w-6xl px-6">
            <SectionTitle>Waar we ons aan houden</SectionTitle>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  t: "Geen claim zonder bron",
                  b: "Wat wij over het product zeggen, kunnen wij onderbouwen. Waar een bron ontbreekt, staat er niets — geen suggestie, geen percentage dat goed klinkt.",
                },
                {
                  t: "Geen angst als verkoopargument",
                  b: "Je krijgt van ons geen foto's van uitgebrande woningen. De maatregel moet op zijn eigen merites te begrijpen zijn.",
                },
                {
                  t: "Traceerbaar tot het lotnummer",
                  b: "Elke unit is herleidbaar tot productiepartij en afnemer. Niet omdat het moet, maar omdat je bij dit product moet kunnen terugvinden wat je hebt geleverd.",
                },
              ].map((x, i) => (
                <Reveal key={x.t} delay={i * 70}>
                  <article className="h-full rounded-2xl border border-railstaal/50 bg-kastwit p-8">
                    <h3 className="font-display text-xl">{x.t}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-staal-tekst">
                      {x.b}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-20">
          <SectionTitle>Wie erachter zit</SectionTitle>
          <p className="mt-4 text-staal-tekst">
            Blusbox.nl is een merk van ZWT, een Nederlands bedrijf. Wij verkopen
            één product en staan daarvoor in: van de bestelling tot de
            vervanging tien jaar later. Vragen komen bij dezelfde mensen terecht
            die de webshop draaiend houden — er zit geen callcenter tussen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
            >
              Neem contact op
            </Link>
            <Link
              href="/zakelijk"
              className="rounded-full border border-antraciet px-6 py-3 text-sm transition-colors hover:bg-antraciet hover:text-kastwit"
            >
              Zakelijk
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
