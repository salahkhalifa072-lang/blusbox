import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { haalFactuur } from "@/db/facturen";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { euro } from "@/lib/pricing";
import { formatteerNl } from "@/lib/levensduur";
import { vervaldatum } from "@/lib/factuur";
import { startBetaling } from "./acties";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Factuur betalen",
  // Hoort bij één klant en heeft in een zoekmachine niets te zoeken.
  robots: { index: false, follow: false },
};

/**
 * Betaalpagina voor een factuur, bereikbaar via de link in de factuurmail.
 *
 * Het token is de sleutel en is niet te raden. Toch staan hier geen naam of
 * adres: wordt de link doorgestuurd, dan ziet de ontvanger alleen een
 * factuurnummer en een bedrag.
 */
export default async function BetaalPagina({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ betaald?: string; fout?: string }>;
}) {
  const { token } = await params;
  const { betaald: terugVanStripe, fout } = await searchParams;

  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();
  const factuur = await haalFactuur({ betaaltoken: token });
  if (!factuur) notFound();

  const voldaan = factuur.status !== "nieuw";
  const totaal = euro(factuur.totalen.totaalInclBtwCenten);

  return (
    <>
      <SiteHeader />
      <main className="pb-24">
        <section className="bg-antraciet pb-14 pt-36 text-kastwit sm:pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="data text-xs uppercase tracking-widest text-railstaal">
              Factuur {factuur.factuurnummer}
            </p>
            <h1 className="font-display mt-5 text-[clamp(2.25rem,6vw,4rem)]">
              {voldaan ? "Betaald" : `Te betalen: ${totaal}`}
            </h1>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-6 py-14">
          <div className="rounded-2xl border border-railstaal/45 bg-kastwit-dim p-6">
            {voldaan ? (
              <>
                <p className="font-medium">Deze factuur is voldaan. Dank je wel.</p>
                <p className="mt-1 text-sm text-staal-tekst">
                  Je hoeft verder niets te doen.
                </p>
              </>
            ) : terugVanStripe ? (
              <>
                <p className="font-medium">Bedankt, je betaling wordt verwerkt.</p>
                <p className="mt-1 text-sm leading-relaxed text-staal-tekst">
                  Bij iDEAL is dat meestal binnen een minuut rond. Ververs deze
                  pagina om de status te zien.
                </p>
              </>
            ) : (
              <>
                <dl className="data grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
                  <dt className="text-staal-tekst">Factuurnummer</dt>
                  <dd>{factuur.factuurnummer}</dd>
                  <dt className="text-staal-tekst">Factuurdatum</dt>
                  <dd>{formatteerNl(factuur.factuurdatum)}</dd>
                  <dt className="text-staal-tekst">Betalen vóór</dt>
                  <dd>{formatteerNl(vervaldatum(factuur.factuurdatum))}</dd>
                  <dt className="text-staal-tekst">Bedrag incl. btw</dt>
                  <dd>{totaal}</dd>
                </dl>
                <form action={startBetaling} className="mt-6">
                  <input type="hidden" name="token" value={token} />
                  <button
                    type="submit"
                    className="rounded-full bg-antraciet px-7 py-3.5 text-sm font-medium text-kastwit transition-opacity hover:opacity-85"
                  >
                    Betaal {totaal}
                  </button>
                </form>
                <p className="mt-3 text-xs text-staal-tekst">
                  Je gaat naar de beveiligde betaalpagina van Stripe (iDEAL,
                  kaart en meer).
                </p>
                {fout ? (
                  <p role="alert" className="mt-4 text-sm text-blusrood-op-licht">
                    De betaling kon niet worden gestart. Probeer het later
                    opnieuw, of neem contact met ons op.
                  </p>
                ) : null}
              </>
            )}
          </div>

          <p className="mt-8 text-sm leading-relaxed text-staal-tekst">
            Vragen over deze factuur? Neem contact op via{" "}
            <Link
              href="/contact"
              className="underline underline-offset-4 hover:text-antraciet"
            >
              onze contactpagina
            </Link>{" "}
            en vermeld factuurnummer{" "}
            <span className="data">{factuur.factuurnummer}</span>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
