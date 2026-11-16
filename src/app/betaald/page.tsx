import type { Metadata } from "next";
import { bedrijf } from "@/lib/bedrijf";

export const metadata: Metadata = {
  title: "Betaling",
  robots: { index: false, follow: false },
};

/**
 * Waar de klant na het betalen aan de deur uitkomt, op zijn eigen telefoon.
 * Kort: de verkoper staat ernaast, en de factuur komt per mail.
 */
export default async function Betaald({ searchParams }: { searchParams: Promise<{ afgebroken?: string; verlopen?: string }> }) {
  const { afgebroken, verlopen } = await searchParams;
  const mislukt = afgebroken || verlopen;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-antraciet px-6 text-center text-kastwit">
      <div className="max-w-sm">
        <p className="text-6xl" aria-hidden>{mislukt ? "…" : "✓"}</p>
        <h1 className="font-display mt-4 text-4xl">
          {mislukt ? "Niet betaald" : "Bedankt, je hebt betaald"}
        </h1>
        <p className="mt-3 text-kastwit/75">
          {mislukt
            ? verlopen
              ? "Deze betaalcode werkt niet meer. Vraag de verkoper om een nieuwe."
              : "De betaling is afgebroken. Je kunt de code opnieuw scannen."
            : "De factuur en het herroepingsformulier komen binnen een paar minuten in je mailbox. Je hebt 14 dagen bedenktijd."}
        </p>
        <p className="data mt-6 text-xs text-kastwit/50">
          {bedrijf.volledig} · {bedrijf.telefoon}
        </p>
      </div>
    </main>
  );
}
