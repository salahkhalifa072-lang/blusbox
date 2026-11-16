import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/auth";
import { vereisVerkoper } from "@/lib/sessie";
import { LogoMark } from "@/components/site/logo";

export const metadata: Metadata = {
  title: "Verkoop",
  robots: { index: false, follow: false },
};

/**
 * Deurverkoop, gemaakt voor een telefoon in één hand: grote knoppen, één
 * kolom, niets dat de verkoper aan de deur hoeft te zoeken.
 */
export default async function VerkoopLayout({ children }: { children: React.ReactNode }) {
  const actor = await vereisVerkoper();

  async function uitloggen() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-dvh bg-kastwit-dim">
      <header className="sticky top-0 z-10 border-b border-railstaal/40 bg-antraciet text-kastwit">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/verkoop" className="flex items-center gap-2 font-display text-lg">
            <LogoMark className="h-6 w-6" />
            Verkoop
          </Link>
          <form action={uitloggen} className="flex items-center gap-3">
            <span className="data hidden truncate text-[11px] text-kastwit/60 sm:inline">{actor.email}</span>
            <button type="submit" className="rounded-full border border-kastwit/30 px-3 py-1.5 text-xs">
              Afmelden
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 pb-16 pt-5">{children}</main>
    </div>
  );
}
