import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { beoordeelToken, wisselTokenIn } from "@/db/wachtwoord-herstel";
import { geldigeTokenvorm } from "@/lib/wachtwoord-herstel";
import { wachtwoordProblemen } from "@/lib/wachtwoord";
import { HerstelFormulier } from "./formulier";

export const metadata: Metadata = {
  title: "Nieuw wachtwoord instellen",
  robots: { index: false, follow: false },
};

/** Het token staat in de URL, dus er valt niets te cachen. */
export const dynamic = "force-dynamic";

/**
 * Een nieuw wachtwoord instellen met een herstellink.
 *
 * Het token zit in het pad en niet in een querystring, en het e-mailadres
 * gaat er niet in mee. Zie lib/wachtwoord-herstel.ts: precies die vorm
 * leverde bij de oude magic link een phishingwaarschuwing van Chrome op.
 */
export default async function HerstelPagina({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Vorm eerst, database daarna: iemand die paden afloopt hoort geen
  // query te veroorzaken.
  const oordeel = geldigeTokenvorm(token)
    ? await beoordeelToken(token)
    : ({
        geldig: false,
        reden:
          "Deze herstellink werkt niet meer. Hij is verlopen of al gebruikt; vraag een nieuwe aan.",
      } as const);

  async function instellen(_vorige: unknown, formData: FormData) {
    "use server";

    const wachtwoord = String(formData.get("wachtwoord") ?? "");
    const herhaal = String(formData.get("wachtwoordHerhaal") ?? "");

    const problemen = wachtwoordProblemen(wachtwoord);
    if (problemen.length > 0) {
      return { fase: "fout" as const, melding: problemen.join(" ") };
    }
    if (wachtwoord !== herhaal) {
      return {
        fase: "fout" as const,
        melding: "De twee wachtwoorden zijn niet gelijk.",
      };
    }

    const uitkomst = await wisselTokenIn(token, wachtwoord);
    if (!uitkomst.gelukt) {
      return { fase: "fout" as const, melding: uitkomst.reden };
    }

    return {
      fase: "klaar" as const,
      melding: "Je wachtwoord is ingesteld. Je kunt nu inloggen.",
    };
  }

  if (!oordeel.geldig) {
    return (
      <>
        <PageHeader
          eyebrow="account"
          title="Deze link werkt niet meer"
          lead={oordeel.reden}
        />
        <main className="mx-auto max-w-md px-6 py-16">
          <Link
            href="/wachtwoord-vergeten"
            className="inline-block rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
          >
            Vraag een nieuwe link aan
          </Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="account"
        title="Nieuw wachtwoord instellen"
        lead="Kies een wachtwoord van minimaal twaalf tekens. Daarna kun je meteen inloggen."
      />
      <main className="mx-auto max-w-md px-6 py-16">
        <HerstelFormulier actie={instellen} />
      </main>
      <SiteFooter />
    </>
  );
}
