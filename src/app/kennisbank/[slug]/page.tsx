import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/site/page-header";
import { KruimelData } from "@/components/site/gestructureerde-data";
import { SiteFooter } from "@/components/site/footer";
import { ARTIKELEN, vindArtikel, type Blok } from "@/lib/kennisbank";
import { siteUrl } from "@/lib/site";
import { prijsIncl } from "@/lib/pricing";

export function generateStaticParams() {
  return ARTIKELEN.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const a = vindArtikel((await params).slug);
  if (!a) return {};
  return {
    // absolute: de vraag zelf is de titel; "— Blusbox" erachter kost
    // ruimte in de zoekresultaten die de vraag beter kan gebruiken.
    title: { absolute: a.titel },
    description: a.omschrijving,
    alternates: { canonical: `/kennisbank/${a.slug}` },
    openGraph: {
      type: "article",
      title: a.titel,
      description: a.omschrijving,
      url: `/kennisbank/${a.slug}`,
      images: [{ url: "/media/google/blusbox-deel.jpg", width: 1200, height: 630, alt: "Blusbox" }],
    },
  };
}

function Inhoud({ blok }: { blok: Blok }) {
  switch (blok.soort) {
    case "h2":
      return <h2 className="font-display mt-10 text-2xl sm:text-3xl">{blok.tekst}</h2>;
    case "p":
      return <p className="mt-4 leading-relaxed text-staal-tekst">{blok.tekst}</p>;
    case "lijst":
      return (
        <ul className="mt-4 space-y-2.5">
          {blok.items.map((i) => (
            <li key={i} className="flex gap-3 leading-relaxed text-staal-tekst">
              <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-antraciet" />
              {i}
            </li>
          ))}
        </ul>
      );
    case "let-op":
      return (
        <p role="note" className="mt-6 rounded-2xl border border-signaal bg-signaal/15 p-5 text-sm leading-relaxed text-antraciet">
          <span className="data mb-1 block text-[11px] uppercase tracking-widest">Let op</span>
          {blok.tekst}
        </p>
      );
  }
}

export default async function ArtikelPagina({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const a = vindArtikel((await params).slug);
  if (!a) notFound();

  const andere = ARTIKELEN.filter((x) => x.slug !== a.slug).slice(0, 3);

  const artikelData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.titel,
    description: a.omschrijving,
    datePublished: a.gepubliceerd,
    dateModified: a.bijgewerkt,
    inLanguage: "nl-NL",
    mainEntityOfPage: `${siteUrl}/kennisbank/${a.slug}`,
    image: [`${siteUrl}/media/google/blusbox-module-169.jpg`],
    author: { "@type": "Organization", name: "Blusbox", url: siteUrl },
    publisher: {
      "@type": "Organization",
      name: "Blusbox",
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo-mark.png` },
    },
  };

  return (
    <>
      <KruimelData
        kruimels={[
          { naam: "Kennisbank", pad: "/kennisbank" },
          { naam: a.kop, pad: `/kennisbank/${a.slug}` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(artikelData) }}
      />
      <PageHeader eyebrow={`kennisbank · ${a.leestijd} min`} title={a.kop} lead={a.intro} />
      <main className="mx-auto max-w-3xl px-6 py-14">
        <article>
          {a.inhoud.map((b, i) => (
            <Inhoud key={i} blok={b} />
          ))}
        </article>

        <aside className="mt-14 rounded-3xl bg-antraciet p-7 text-kastwit sm:p-9">
          <p className="data text-[11px] uppercase tracking-widest text-railstaal">Blusbox</p>
          <p className="font-display mt-3 text-3xl leading-tight">
            Een brandblusser die in de meterkast blijft hangen.
          </p>
          <p className="mt-3 max-w-xl text-kastwit/75">
            Klikt op de DIN-rail naast je groepen, heeft geen stroom nodig en grijpt
            vanzelf in bij 170 °C. Gratis verzonden.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href="/blusbox"
              className="rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-semibold text-kastwit transition-colors hover:bg-[#9e1b18]"
            >
              Bekijk Blusbox · {prijsIncl}
            </Link>
            <Link href="/meterkastbrand" className="text-sm text-kastwit/80 underline underline-offset-4">
              Meer over brand in de meterkast
            </Link>
          </div>
        </aside>

        <nav aria-label="Meer artikelen" className="mt-14">
          <h2 className="font-display text-2xl">Lees ook</h2>
          <ul className="mt-5 divide-y divide-railstaal/50 border-y border-railstaal/50">
            {andere.map((x) => (
              <li key={x.slug}>
                <Link
                  href={`/kennisbank/${x.slug}`}
                  className="flex items-center justify-between gap-4 py-4 hover:text-blusrood-op-licht"
                >
                  <span>{x.kop}</span>
                  <span aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/kennisbank" className="data mt-4 inline-block text-xs underline underline-offset-4">
            Alle artikelen
          </Link>
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
