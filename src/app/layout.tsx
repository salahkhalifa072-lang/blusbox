import type { Metadata } from "next";
import { Archivo, Instrument_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

// Display face — Archivo variable, width axis loaded so .font-display
// can push it to 125% (Archivo Expanded per the brief).
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  weight: "variable",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "variable",
});

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${archivo.variable} ${instrumentSans.variable} ${geistMono.variable}`}
    >
      <body className="bg-kastwit text-antraciet antialiased">
        {children}
      </body>
    </html>
  );
}
