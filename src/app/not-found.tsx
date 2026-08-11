import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";

export const metadata: Metadata = {
  title: "Pagina niet gevonden",
  robots: { index: false, follow: true },
};

/**
 * 404. A dead end on a webshop costs a sale, so this offers the three routes
 * people actually arrive looking for rather than a bare apology.
 */

const routes = [
  {
    href: "/blusbox",
    kop: "Blusbox bestellen",
    regel: "De module, de specificaties en de prijs.",
  },
  {
    href: "/hoe-het-werkt",
    kop: "Hoe het werkt",
    regel: "Wat er gebeurt bij 170 °C, stap voor stap.",
  },
  {
    href: "/veelgestelde-vragen",
    kop: "Veelgestelde vragen",
    regel: "Montage, levensduur, retourneren en garantie.",
  },
  {
    href: "/contact",
    kop: "Contact",
    regel: "Staat je vraag er niet bij? Laat het ons weten.",
  },
];

export default function NietGevonden() {
  return (
    <>
      <PageHeader
        eyebrow="foutcode 404"
        title="Deze pagina"
        accent="bestaat niet"
        lead="De link is verlopen, verkeerd overgetypt, of de pagina is verplaatst. Hieronder staat waar de meeste mensen naartoe willen."
      />
      <main className="pb-24">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <ul className="grid gap-4 sm:grid-cols-2">
            {routes.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  className="block rounded-2xl border border-railstaal/45 bg-kastwit p-6 transition-colors hover:border-antraciet/35"
                >
                  <p className="font-medium">{r.kop}</p>
                  <p className="mt-1.5 text-sm text-staal-tekst">{r.regel}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
