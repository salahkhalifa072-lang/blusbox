import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SiteFooter } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { Cel, Leeg, Paneel, Rij, Tabel, Tegel } from "@/components/dashboard/ui";
import { Linkgereedschap } from "@/components/affiliate/linkgereedschap";
import { vereisLogin } from "@/lib/sessie";
import {
  affiliateVanGebruiker,
  commissiesVoorAffiliate,
  haalInstellingen,
  statistiekenVoorAffiliate,
} from "@/db/affiliate";
import { euro } from "@/lib/pricing";
import { formatteerNl } from "@/lib/levensduur";

export const metadata: Metadata = {
  title: "Affiliate-dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Het dashboard van één affiliate.
 *
 * Alle gegevens worden opgehaald op basis van de affiliate die bij de
 * ingelogde gebruiker hoort, nooit op basis van een id uit de URL. Dat is
 * wat voorkomt dat iemand het dashboard van een ander opent door een
 * nummer te veranderen — de klassieke IDOR, en de reden dat er op deze
 * pagina geen enkele parameter staat.
 */

/** Statuslabels in gewone taal; een affiliate hoeft geen jargon te leren. */
const STATUSTEKST: Record<string, { label: string; uitleg: string }> = {
  open: {
    label: "Open",
    uitleg: "De bedenktijd van de klant loopt nog.",
  },
  goedgekeurd: {
    label: "Goedgekeurd",
    uitleg: "Klaar om uitbetaald te worden.",
  },
  uitbetaald: { label: "Uitbetaald", uitleg: "Overgemaakt." },
  teruggedraaid: {
    label: "Vervallen",
    uitleg: "De bestelling is geannuleerd of geretourneerd.",
  },
  geblokkeerd: {
    label: "In onderzoek",
    uitleg: "Wij kijken hier nog naar.",
  },
};

export default async function AffiliateDashboard() {
  const actor = await vereisLogin();
  const affiliate = await affiliateVanGebruiker(actor.id);

  if (!affiliate) redirect("/affiliate");

  const instellingen = await haalInstellingen();
  const kop = await headers();
  const host = kop.get("host") ?? "www.blusbox.nl";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const basisUrl = `${protocol}://${host}`;

  /* Nog niet goedgekeurd: geen cijfers, geen link, wel duidelijkheid. */
  if (affiliate.status !== "goedgekeurd") {
    const boodschap =
      affiliate.status === "aangevraagd"
        ? "Je aanmelding is binnen en wordt beoordeeld. Zodra je meedoet staat je persoonlijke link hier klaar."
        : affiliate.status === "afgewezen"
          ? "Je aanmelding is niet goedgekeurd."
          : "Je deelname staat tijdelijk stil.";

    return (
      <>
        <PageHeader eyebrow="partnerprogramma" title="Je aanmelding" lead={boodschap} />
        <main className="mx-auto max-w-3xl px-6 pb-24">
          {affiliate.beheerdersnotitie && (
            <div className="rounded-2xl border border-railstaal bg-kastwit p-5">
              <p className="data text-xs uppercase tracking-widest text-staal-tekst">
                Toelichting
              </p>
              <p className="mt-2 text-sm">{affiliate.beheerdersnotitie}</p>
            </div>
          )}
          <p className="mt-6 text-sm text-staal-tekst">
            Vragen? Mail naar{" "}
            <a href="mailto:info@blusbox.nl" className="underline underline-offset-4">
              info@blusbox.nl
            </a>
            .
          </p>
        </main>
        <SiteFooter />
      </>
    );
  }

  const [stats, commissies] = await Promise.all([
    statistiekenVoorAffiliate(affiliate.id),
    commissiesVoorAffiliate(affiliate.id),
  ]);

  const percentage = (
    (affiliate.percentageBp ?? instellingen.standaardPercentageBp) / 100
  )
    .toFixed(2)
    .replace(/[.,]00$/, "")
    .replace(".", ",");

  const conversie = (stats.conversiePromille / 10).toFixed(1).replace(".", ",");

  return (
    <>
      <PageHeader
        eyebrow="partnerprogramma"
        title="Je dashboard"
        lead={`Je verdient ${percentage}% over de productwaarde van elke verkoop via jouw link.`}
      />

      <main className="mx-auto max-w-6xl space-y-10 px-6 pb-24">
        {/* Cijfers */}
        <section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tegel label="Klikken" waarde={String(stats.klikken)} />
            <Tegel label="Bestellingen" waarde={String(stats.bestellingen)} />
            <Tegel label="Conversie" waarde={`${conversie}%`} />
            <Tegel label="Totaal verdiend" waarde={euro(stats.totaalCenten)} />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Tegel label="Open" waarde={euro(stats.openCenten)} />
            <Tegel label="Goedgekeurd" waarde={euro(stats.goedgekeurdCenten)} />
            <Tegel label="Uitbetaald" waarde={euro(stats.uitbetaaldCenten)} />
          </div>

          <p className="mt-4 max-w-prose text-sm text-staal-tekst">
            Uitbetaling gebeurt {instellingen.uitbetalingsfrequentie} zodra je
            goedgekeurde saldo ten minste{" "}
            {euro(instellingen.uitbetalingsdrempelCenten)} is. Haal je de
            drempel niet, dan blijft het staan en telt het de volgende ronde
            mee — er vervalt niets.
          </p>
        </section>

        {/* Links */}
        <Paneel titel="Je links">
          <Linkgereedschap slug={affiliate.slug} basisUrl={basisUrl} />
        </Paneel>

        {/* Verkopen */}
        <Paneel titel="Verkopen en commissie">
          {commissies.length === 0 ? (
            <Leeg tekst="Nog geen verkopen. Zodra iemand via jouw link bestelt en betaalt, verschijnt de regel hier." />
          ) : (
            <Tabel
              koppen={[
                "Besteld",
                "Bestelnummer",
                "Omzet",
                "Percentage",
                "Commissie",
                "Status",
                "Verwacht goedgekeurd",
              ]}
            >
              {commissies.map((c) => {
                const st = STATUSTEKST[c.status] ?? {
                  label: c.status,
                  uitleg: "",
                };
                return (
                  <Rij key={c.id}>
                    <Cel mono>
                      {formatteerNl(c.besteldOp.toISOString().slice(0, 10))}
                    </Cel>
                    <Cel mono>{c.ordernummer}</Cel>
                    <Cel mono>{euro(c.grondslagCenten)}</Cel>
                    <Cel mono>
                      {(c.percentageBp / 100).toString().replace(".", ",")}%
                    </Cel>
                    <Cel mono>{euro(c.bedragCenten)}</Cel>
                    <Cel>
                      <span title={st.uitleg}>{st.label}</span>
                    </Cel>
                    <Cel mono>
                      {c.rijpOp
                        ? formatteerNl(c.rijpOp.toISOString().slice(0, 10))
                        : "na levering"}
                    </Cel>
                  </Rij>
                );
              })}
            </Tabel>
          )}

          <p className="mt-5 max-w-prose text-xs text-staal-tekst">
            Je ziet hier dát er is besteld en wat het oplevert. Wie de klant is
            krijg je niet te zien — dat zijn hun gegevens, niet de jouwe.
          </p>
        </Paneel>

        {/* Uitleg statussen */}
        <Paneel titel="Wat de statussen betekenen">
          <dl className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
            {Object.entries(STATUSTEKST).map(([sleutel, s]) => (
              <div key={sleutel}>
                <dt className="text-sm font-medium">{s.label}</dt>
                <dd className="mt-0.5 text-sm text-staal-tekst">{s.uitleg}</dd>
              </div>
            ))}
          </dl>
        </Paneel>

        <p className="text-sm text-staal-tekst">
          <Link href="/affiliate/voorwaarden" className="underline underline-offset-4">
            Affiliatevoorwaarden
          </Link>
          {" · "}
          <a href="mailto:info@blusbox.nl" className="underline underline-offset-4">
            Vraag of wijziging doorgeven
          </a>
        </p>
      </main>

      <SiteFooter />
    </>
  );
}
