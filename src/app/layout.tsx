import type { Metadata } from "next";
import { Anton, Manrope, Geist_Mono } from "next/font/google";
import { siteUrl } from "@/lib/site";
import { OrganisatieData } from "@/components/site/gestructureerde-data";
import { Meting } from "@/components/meting/meting";
import "./globals.css";

/**
 * Display face — Anton: heavy condensed uppercase grotesque, the
 * reference look. Set tight and large; never for running text.
 */
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

// Body — Manrope, modern geometric sans.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: "variable",
});

// Data face — every measurable value (§6).
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Blusbox — automatische blusmodule voor de meterkast",
    template: "%s — Blusbox",
  },
  description:
    "Een compacte blusmodule in je meterkast die bij 170 °C vanzelf ingrijpt. Geen stroom. Geen bediening. Geen mens.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  /*
   * Eigendomsbewijs voor Search Console en Merchant Center.
   *
   * Uit een omgevingsvariabele en niet hard in de code: de code is van
   * het Google-account van de eigenaar, en dit is een openbare
   * repository. Bovendien hoeft er zo niets herschreven te worden als
   * die ooit verandert — de tag verschijnt zodra de variabele in Vercel
   * staat, en blijft weg zolang dat niet zo is.
   *
   * Zonder geverifieerd domein weigert Merchant Center de productfeed,
   * dus dit is geen bijzaak maar een voorwaarde.
   */
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  // §11: nl-NL now, with nl-BE ready to switch on when we ship to Belgium.
  alternates: {
    canonical: "/",
    languages: { "nl-NL": "/" },
  },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "Blusbox",
    url: siteUrl,
  },
  // Geen expliciete robots-regel: indexeren is de standaard, en deze regel
  // werd óók op de 404 gezet — naast Next' eigen `noindex`. Twee meta-tags
  // met tegengestelde instructies laat je niet aan Google over.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${anton.variable} ${manrope.variable} ${geistMono.variable}`}
    >
      <body className="bg-kastwit text-antraciet antialiased">
        <OrganisatieData />
        {children}
        <Meting />
      </body>
    </html>
  );
}
