import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { RetourFormulier } from "./formulier";

export const metadata: Metadata = {
  title: "Retour aanmelden",
  description:
    "Meld je retour aan met je bestelnummer en e-mailadres. Binnen veertien dagen na ontvangst hoef je geen reden op te geven.",
  alternates: { canonical: "/retourneren/aanvragen" },
};

export default function RetourAanvragenPage() {
  return (
    <>
      <PageHeader
        eyebrow="retourneren"
        title="Retour aanmelden"
        lead="Vul je bestelnummer en e-mailadres in. Je hoeft geen account te hebben — ook een gastbestelling kun je hier aanmelden."
      />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <RetourFormulier />

          <aside className="h-fit space-y-6">
            <div className="rounded-2xl border border-railstaal/50 p-6">
              <h2 className="font-display text-xl">Hoe het verder gaat</h2>
              <ol className="mt-4 space-y-3 text-sm text-staal-tekst">
                <li className="flex gap-3">
                  <span className="data text-blusrood-op-licht">01</span>
                  <span>Je meldt de retour aan met dit formulier.</span>
                </li>
                <li className="flex gap-3">
                  <span className="data text-blusrood-op-licht">02</span>
                  <span>
                    Je krijgt een bevestiging met retourinstructies en de
                    vervoersdocumenten.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="data text-blusrood-op-licht">03</span>
                  <span>
                    Je stuurt het product volgens die instructies terug, binnen
                    veertien dagen na je melding.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="data text-blusrood-op-licht">04</span>
                  <span>
                    Na ontvangst en controle betalen wij terug binnen de
                    wettelijke termijn.
                  </span>
                </li>
              </ol>
            </div>

            <div className="rounded-2xl border border-railstaal/50 p-6">
              <h2 className="font-display text-xl">Liever het modelformulier?</h2>
              <p className="mt-3 text-sm leading-relaxed text-staal-tekst">
                Je mag ook het wettelijk modelformulier voor herroeping
                gebruiken. Verplicht is het niet — dit formulier volstaat.
              </p>
              <a
                href="/herroepingsformulier.pdf"
                className="data mt-4 inline-block text-sm underline underline-offset-4"
              >
                Modelformulier downloaden (pdf)
              </a>
            </div>

            <p className="text-xs leading-relaxed text-staal-tekst">
              Meer weten over je rechten? Lees{" "}
              <Link href="/herroepingsrecht" className="underline underline-offset-4">
                herroepingsrecht
              </Link>{" "}
              en{" "}
              <Link href="/garantie" className="underline underline-offset-4">
                garantie en conformiteit
              </Link>
              .
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
