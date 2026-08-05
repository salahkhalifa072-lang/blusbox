import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";

export const metadata: Metadata = {
  title: "Winkelwagen",
  description: "Je winkelwagen bij Blusbox.",
  robots: { index: false },
};

/** Placeholder until §14 step 6 (catalogue, cart, Mollie, shipping rules). */
export default function WinkelwagenPage() {
  return (
    <>
      <PageHeader
        eyebrow="bestellen"
        title="Winkelwagen"
        lead="Je winkelwagen is leeg."
      />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-2xl border border-railstaal/50 p-8">
          <h2 className="font-display text-2xl">Bestellen komt eraan</h2>
          <p className="mt-3 text-staal-tekst">
            De webshop gaat open zodra prijzen, voorraad en de verzendregels per
            bestemming zijn ingesteld. Wil je nu al bestellen of een zakelijke
            offerte aanvragen, neem dan contact op.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-full bg-blusrood px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#b81e1b]"
            >
              Neem contact op
            </Link>
            <Link
              href="/blusbox"
              className="rounded-full border border-antraciet px-6 py-3 text-sm transition-colors hover:bg-antraciet hover:text-kastwit"
            >
              Bekijk Blusbox
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
