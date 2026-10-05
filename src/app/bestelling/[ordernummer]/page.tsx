import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { haalBestelling } from "@/lib/bestelling";
import { euro, verzendwaarde } from "@/lib/pricing";
import { formatteerNl } from "@/lib/levensduur";
import { Aankoop } from "@/components/meting/aankoop";
import { isBetaald } from "@/lib/meting";

export const metadata: Metadata = {
  title: "Bestelling",
  robots: { index: false },
};

const statusTekst: Record<string, { kop: string; uitleg: string }> = {
  nieuw: {
    kop: "Bestelling ontvangen",
    uitleg:
      "We hebben je bestelling vastgelegd. Zodra de betaling binnen is, gaat de zending klaar.",
  },
  betaald: {
    kop: "Betaling ontvangen",
    uitleg:
      "Dank je wel. Je bestelling wordt klaargemaakt voor verzending; je krijgt bericht zodra die onderweg is.",
  },
  in_behandeling: {
    kop: "In behandeling",
    uitleg: "Je bestelling wordt klaargemaakt voor verzending.",
  },
  verzonden: {
    kop: "Verzonden",
    uitleg: "Je bestelling is onderweg.",
  },
  geleverd: { kop: "Geleverd", uitleg: "Je bestelling is bezorgd." },
  geannuleerd: {
    kop: "Betaling niet afgerond",
    uitleg:
      "De betaling is geannuleerd of verlopen. Je bestelling staat klaar; je kunt hem opnieuw proberen te betalen.",
  },
  terugbetaald: {
    kop: "Terugbetaald",
    uitleg: "Het bedrag is teruggestort.",
  },
};

export default async function BestellingPage({
  params,
  searchParams,
}: {
  params: Promise<{ ordernummer: string }>;
  searchParams: Promise<{ betalen?: string }>;
}) {
  const { ordernummer } = await params;
  const { betalen } = await searchParams;

  const gegevens = await haalBestelling(decodeURIComponent(ordernummer));
  if (!gegevens) notFound();

  const { order, regels } = gegevens;
  const status = statusTekst[order.status] ?? statusTekst.nieuw;

  /*
   * De conversie telt pas als er betaald is. De bevestigingspagina bestaat
   * al daarvoor — wie afhaakt op het betaalscherm komt hier ook terecht —
   * en zou anders als verkoop meetellen.
   */
  const meetregels = regels.map((r) => ({
    id: r.slug === "blusbox" || r.slug === "vervangmodule" ? "BB-MODULE-01" : r.slug,
    naam: r.naam,
    aantal: r.aantal,
    stukprijsCenten: r.stukprijsExclBtwCenten,
  }));

  return (
    <>
      {isBetaald(order.status) && (
        <Aankoop
          ordernummer={order.ordernummer}
          waardeCenten={order.subtotaalExclBtwCenten}
          regels={meetregels}
        />
      )}
      <PageHeader
        eyebrow={`bestelnummer ${order.ordernummer}`}
        title={status.kop}
        lead={status.uitleg}
      />
      <main className="mx-auto max-w-3xl px-6 py-16">
        {betalen === "nietingesteld" ? (
          <div
            role="note"
            className="mb-10 rounded-2xl border border-signaal bg-signaal/15 p-5"
          >
            <p className="data text-xs uppercase tracking-widest">
              Betalen nog niet actief
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              Je bestelling is vastgelegd onder nummer{" "}
              <span className="data">{order.ordernummer}</span>, maar de
              betaalkoppeling staat nog niet live. Wij nemen contact met je op
              om de betaling af te ronden.
            </p>
          </div>
        ) : null}

        <section aria-label="Besteloverzicht">
          <ul className="divide-y divide-railstaal/50 border-y border-railstaal/50">
            {regels.map((r) => (
              <li key={r.id} className="flex justify-between gap-4 py-4">
                <span>
                  {r.aantal}× {r.naam}
                </span>
                <span className="data shrink-0">
                  {euro(r.stukprijsExclBtwCenten * r.aantal)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-staal-tekst">Subtotaal excl. btw</dt>
              <dd className="data">{euro(order.subtotaalExclBtwCenten)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-staal-tekst">
                {order.btwVerlegd ? "Btw verlegd" : "Btw"}
              </dt>
              <dd className="data">{euro(order.btwBedragCenten)}</dd>
            </div>
            {order.kortingscode && order.kortingBedragCenten > 0 && (
              /*
                Ter informatie: het bedrag zit al verwerkt in het
                subtotaal hierboven, want de korting is op de stukprijs
                toegepast. Hier staat alleen wát er is verrekend, zodat de
                klant het verschil met de winkelprijs kan plaatsen.
              */
              <div className="flex justify-between">
                <dt className="text-staal-tekst">
                  Korting{" "}
                  <span className="data uppercase">{order.kortingscode}</span>{" "}
                  <span className="text-xs">(al verwerkt)</span>
                </dt>
                <dd className="data text-blusrood-op-licht">
                  −{euro(order.kortingBedragCenten)}
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
                {euro(order.totaalInclBtwCenten)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-12" aria-label="Bezorgadres">
          <h2 className="font-display text-xl">Bezorgadres</h2>
          <p className="data mt-3 text-sm text-staal-tekst">
            {[order.straat, order.huisnummer].filter(Boolean).join(" ")}
            {order.straat || order.huisnummer ? <br /> : null}
            {[order.postcode, order.plaats].filter(Boolean).join("  ")}
            <br />
            {order.landcode}
          </p>
          <p className="data mt-4 text-xs text-staal-tekst">
            Besteld op {formatteerNl(order.geplaatstOp.toISOString().slice(0, 10))}
          </p>
        </section>

        <section className="mt-12 rounded-2xl border border-railstaal/50 p-6">
          <h2 className="font-display text-xl">Wat er nu gebeurt</h2>
          <ol className="mt-4 space-y-3 text-sm text-staal-tekst">
            <li>
              Je ontvangt een bevestiging per e-mail, met daarin het wettelijk
              modelformulier voor herroeping.
            </li>
            <li>
              Je pakket wordt binnen één werkdag bezorgd. Zodra het onderweg
              is, krijg je bericht.
            </li>
            <li>
              Bij levering krijg je het lotnummer van je module. Registreer de
              installatiedatum, dan waarschuwen wij je op tijd voor vervanging.
            </li>
          </ol>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-antraciet px-6 py-3 text-sm transition-colors hover:bg-antraciet hover:text-kastwit"
          >
            Terug naar de site
          </Link>
          <Link
            href="/contact"
            className="data px-2 py-3 text-sm underline underline-offset-4"
          >
            Vraag over deze bestelling
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
