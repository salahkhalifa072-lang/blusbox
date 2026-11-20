import type { Metadata } from "next";
import Link from "next/link";
import { Toevoegformulier } from "../formulieren";

export const metadata: Metadata = {
  title: "Bericht toevoegen",
  robots: { index: false },
};

/**
 * Een vraag overnemen die niet via het formulier binnenkwam, of van vóór
 * de tijd dat berichten werden opgeslagen. Daarna is hij te beantwoorden
 * zoals elk ander bericht.
 */
export default function NieuwBerichtPagina() {
  return (
    <div className="space-y-6">
      <Link href="/dashboard/berichten" className="data text-xs text-staal-tekst underline underline-offset-4">
        ← Alle berichten
      </Link>
      <div>
        <h1 className="font-display text-2xl sm:text-3xl">Bericht toevoegen</h1>
        <p className="mt-2 max-w-prose text-sm text-staal-tekst">
          Voor een vraag die per mail, telefoon of WhatsApp binnenkwam. Plak de
          gegevens hieronder; daarna kun je hem beantwoorden vanaf info@blusbox.nl.
        </p>
      </div>
      <Toevoegformulier />
    </div>
  );
}
