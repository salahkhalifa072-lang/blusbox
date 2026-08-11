import Link from "next/link";
import { siteUrl } from "@/lib/site";

/**
 * §11 structured data.
 *
 * Only facts that are actually true go in here. Google penalises
 * structured data that disagrees with the visible page, and inventing a
 * telephone number or an address to fill a schema field would also break
 * the brief's standing rule. Fields the client has not supplied are left
 * out entirely rather than filled with a placeholder — an absent field is
 * honest, a fake one is not.
 */

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganisatieData() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Blusbox",
        url: siteUrl,
        logo: `${siteUrl}/logo-mark.png`,
        description:
          "Blusbox levert een automatische blusmodule voor de meterkast die bij 170 °C zichzelf activeert, zonder stroom en zonder bediening.",
        areaServed: { "@type": "Country", name: "Nederland" },
        // legalName, taxID, vatID, address and telephone are deliberately
        // omitted until the client supplies them (see OPEN.md).
      }}
    />
  );
}

export type Kruimel = { naam: string; pad: string };

/**
 * BreadcrumbList. The trail must match what the visitor can actually see
 * and click, so pages pass their own real path rather than a synthetic
 * hierarchy.
 */
export function KruimelData({ kruimels }: { kruimels: Kruimel[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { naam: "Home", pad: "/" },
          ...kruimels,
        ].map((k, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: k.naam,
          item: `${siteUrl}${k.pad === "/" ? "" : k.pad}`,
        })),
      }}
    />
  );
}

/** Visible breadcrumb trail, so the structured data has something to describe. */
export function Kruimelpad({ kruimels }: { kruimels: Kruimel[] }) {
  return (
    <nav aria-label="Kruimelpad" className="mx-auto max-w-6xl px-6 pt-4">
      <ol className="data flex flex-wrap items-center gap-1 text-[11px] text-staal-tekst">
        <li>
          <Link
            href="/"
            className="underline underline-offset-4 hover:text-antraciet"
          >
            Home
          </Link>
        </li>
        {kruimels.map((k, i) => (
          <li key={k.pad} className="flex items-center gap-1">
            <span aria-hidden>/</span>
            {i === kruimels.length - 1 ? (
              <span aria-current="page">{k.naam}</span>
            ) : (
              <Link
                href={k.pad}
                className="underline underline-offset-4 hover:text-antraciet"
              >
                {k.naam}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
