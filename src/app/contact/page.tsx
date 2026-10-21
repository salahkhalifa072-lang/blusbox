import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { bedrijf } from "@/lib/bedrijf";
import { ContactFormulier } from "./formulier";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Stel je vraag over Blusbox, vraag een zakelijke offerte aan of stuur een foto van je meterkast voor advies over de plaatsing.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="contact"
        title="Stel je vraag"
        lead="Vragen over plaatsing, levering of een zakelijke aanvraag komen bij iemand terecht die het product kent. Reactie binnen één werkdag."
      />
      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <ContactFormulier />

          {/* Company details — §8 requires these to be findable */}
          <aside className="h-fit rounded-2xl border border-railstaal/50 p-8">
            <h2 className="font-display text-2xl">{bedrijf.naam}</h2>
            <dl className="data mt-6 space-y-4 text-sm">
              {[
                ["E-mail", bedrijf.email],
                ["Telefoon", bedrijf.telefoon],
                ["Handelsnaam", bedrijf.volledig],
                ["KvK", bedrijf.kvk],
                ["Btw-id", bedrijf.btwId],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase tracking-wider text-staal-tekst">
                    {k}
                  </dt>
                  <dd className="mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm leading-relaxed text-staal-tekst">
              Voor vragen over een lopende bestelling: vermeld je bestelnummer,
              dan zoeken we het direct op.
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
