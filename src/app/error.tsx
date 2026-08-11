"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";

/**
 * Uncaught error boundary.
 *
 * Deliberately says nothing about what broke: an error message from the
 * server can carry a query, a path or an order id, and this page is public.
 * The digest is Next's own hash of the stack — safe to show, and the only
 * thing that lets support tie a report back to a log line.
 */
export default function Fout({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <SiteHeader />
      <main className="bg-antraciet text-kastwit">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-24">
          <p className="data text-xs uppercase tracking-widest text-railstaal">
            er ging iets mis
          </p>
          <h1 className="font-display mt-4 max-w-3xl text-[clamp(2.5rem,7vw,5rem)]">
            Deze pagina <span className="accent">laadde niet</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-kastwit/70">
            Er is een storing aan onze kant. Je bestelling en je gegevens zijn
            niet aangepast. Probeer het opnieuw — blijft het misgaan, laat het
            ons dan weten.
          </p>

          {error.digest ? (
            <p className="data mt-6 text-sm text-railstaal">
              Foutcode: <span className="text-kastwit">{error.digest}</span>
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
            >
              Opnieuw proberen
            </button>
            <Link
              href="/"
              className="rounded-full border border-kastwit/40 px-6 py-3 text-sm text-kastwit transition-colors hover:bg-kastwit hover:text-antraciet"
            >
              Naar de homepage
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-kastwit/40 px-6 py-3 text-sm text-kastwit transition-colors hover:bg-kastwit hover:text-antraciet"
            >
              Contact
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
