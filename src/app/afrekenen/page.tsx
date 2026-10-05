import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { leesWagen } from "@/lib/winkelwagen-cookie";
import { berekenWagen, regelKortingBp } from "@/lib/winkelwagen";
import { naKorting } from "@/lib/korting";
import { euro, verzendwaarde } from "@/lib/pricing";
import { stripeBeschikbaar, stripeTestmodus } from "@/lib/stripe";
import { AfrekenFormulier } from "./formulier";
import { Kortingsveld } from "@/components/winkel/kortingsveld";
import { Rookmelderaanbod } from "@/components/winkel/rookmelderaanbod";
import { ROOKMELDER_SLUG } from "@/lib/catalogus";
import { leesKortingscode } from "@/lib/kortingscode-cookie";
import { beoordeelInvoer } from "@/db/korting";

export const metadata: Metadata = {
  title: "Afrekenen",
  robots: { index: false },
};

export default async function AfrekenenPage() {
  const wagen = await leesWagen();

  /*
   * De code elke keer opnieuw beoordelen en niet vertrouwen op wat er in
   * de cookie staat. Een code die inmiddels is uitgezet of op is, moet
   * hier vandaag al vervallen — ook bij iemand die hem gisteren invoerde
   * en de pagina open liet staan.
   */
  const bewaardeCode = await leesKortingscode();
  const oordeel = bewaardeCode ? await beoordeelInvoer(bewaardeCode) : null;
  const korting = oordeel?.geldig
    ? { code: oordeel.code, percentageBp: oordeel.percentageBp }
    : null;

  const overzicht = berekenWagen(wagen, {
    landcode: "NL",
    isZakelijk: false,
    btwIdGevalideerd: false,
    korting,
  });

  // Nothing to pay for — send them back rather than showing an empty form.
  if (overzicht.leeg) redirect("/winkelwagen");

  return (
    <>
      <PageHeader
        eyebrow="afrekenen"
        title="Bestelling afronden"
        lead="Gast bestellen kan gewoon; een account is niet nodig. Verzending is altijd gratis."
      />
      <main className="mx-auto max-w-5xl px-6 py-16">
        {!stripeBeschikbaar() ? (
          <div
            role="note"
            className="mb-10 rounded-2xl border border-signaal bg-signaal/15 p-5"
          >
            <p className="data text-xs uppercase tracking-widest">
              Betalen nog niet actief
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              De betaalkoppeling is nog niet ingesteld. Je bestelling wordt wel
              vastgelegd en je krijgt een bestelnummer, maar afrekenen kan pas
              zodra de koppeling live staat.
            </p>
          </div>
        ) : stripeTestmodus() ? (
          <div
            role="note"
            className="mb-10 rounded-2xl border border-signaal bg-signaal/15 p-5"
          >
            <p className="data text-xs uppercase tracking-widest">Testmodus</p>
            <p className="mt-2 text-sm">
              Er wordt geen echt geld afgeschreven. Gebruik de iDEAL-testbank op de betaalpagina.
            </p>
          </div>
        ) : null}

        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <AfrekenFormulier
            bedrag={euro(overzicht.totalen.totaalInclBtwCenten)}
          />

          {/* Op mobiel bovenaan: wie afrekent wil eerst zien wát hij betaalt,
              en het rookmelderaanbod moet vóór de betaalknop staan in plaats
              van eronder, waar je het pas ziet als het te laat is. */}
          <aside className="order-first h-fit rounded-2xl border border-railstaal/50 p-6 lg:order-none lg:sticky lg:top-32">
            <h2 className="font-display text-xl">Je bestelling</h2>

            <ul className="mt-5 space-y-3 text-sm">
              {overzicht.regels.map((r) => (
                <li key={r.item.slug} className="flex justify-between gap-4">
                  <span>
                    {r.aantal}× {r.item.naam}
                  </span>
                  {/* Inclusief btw: dit is een consumentenpagina, en het
                      rookmelderaanbod eronder noemt ook de prijs inclusief.
                      Twee soorten bedragen in één lijstje laat de klant
                      zelf moeten rekenen. */}
                  <span className="data shrink-0">
                    {euro(
                      naKorting(
                        r.item.prijsInclBtwCenten ?? r.item.prijsExclBtwCenten,
                        regelKortingBp(r.item, korting?.percentageBp ?? 0),
                      ) * r.aantal,
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <Rookmelderaanbod
              inWagen={wagen.regels.some((r) => r.slug === ROOKMELDER_SLUG)}
            />

            <dl className="hairline-t mt-5 space-y-2 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-staal-tekst">Subtotaal excl. btw</dt>
                <dd className="data">
                  {euro(overzicht.totalen.subtotaalExclBtwCenten)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-staal-tekst">Btw</dt>
                <dd className="data">
                  {euro(overzicht.totalen.btwBedragCenten)}
                </dd>
              </div>
              {overzicht.korting && (
                <div className="flex justify-between">
                  <dt className="text-staal-tekst">
                    Korting{" "}
                    <span className="data uppercase">
                      {overzicht.korting.code}
                    </span>
                  </dt>
                  <dd className="data text-blusrood-op-licht">
                    −{euro(overzicht.korting.bedragCenten)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-staal-tekst">Verzending</dt>
                <dd className="data">
                  <span className="text-staal-tekst line-through">
                    {verzendwaarde}
                  </span>{" "}
                  gratis
                </dd>
              </div>
              <div className="hairline-t flex justify-between pt-3">
                <dt className="font-medium">Totaal incl. btw</dt>
                <dd className="data text-lg">
                  {euro(overzicht.totalen.totaalInclBtwCenten)}
                </dd>
              </div>
            </dl>

            <Kortingsveld toegepast={korting} />

            <p className="data mt-5 text-xs leading-relaxed text-staal-tekst">
              Verzending is gratis. Besteld op een werkdag vóór 16:00, dan gaat
              je pakket dezelfde dag de deur uit.
            </p>

            <Link
              href="/winkelwagen"
              className="data mt-4 inline-block text-xs underline underline-offset-4"
            >
              Winkelwagen aanpassen
            </Link>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
