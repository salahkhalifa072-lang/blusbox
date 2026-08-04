import type { Metadata } from "next";
import { Anton, Manrope, Geist_Mono } from "next/font/google";
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
  title: {
    default: "Blusbox — automatische blusmodule voor de meterkast",
    template: "%s — Blusbox",
  },
  description:
    "Een compacte blusmodule in je meterkast die bij 170 °C vanzelf ingrijpt. Geen stroom. Geen bediening. Geen mens.",
  icons: {
    icon: "/icon.svg",
  },
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
      <body className="bg-kastwit text-antraciet antialiased">{children}</body>
    </html>
  );
}
