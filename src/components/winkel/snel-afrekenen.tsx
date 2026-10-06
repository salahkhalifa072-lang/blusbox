"use client";

import { useFormStatus } from "react-dom";
import { snelAfrekenen } from "@/app/afrekenen/acties";

/**
 * Snel afrekenen: zonder ons adresformulier naar de betaalpagina, waar
 * Apple Pay en iDEAL bovenaan staan en Stripe het adres vraagt.
 *
 * Geen Apple-logo op de knop. Dat logo mag alleen op een knop die direct
 * een Apple Pay-betaling start, volgens de richtlijnen van Apple; deze knop
 * opent de betaalpagina waar de klant zelf kiest.
 */
function Knop() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-antraciet px-6 py-4 text-base font-semibold text-kastwit transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Betaalpagina openen…" : "Snel afrekenen"}
      {!pending && <span aria-hidden>→</span>}
    </button>
  );
}

export function SnelAfrekenen() {
  return (
    <div className="mt-6">
      <form action={snelAfrekenen}>
        <Knop />
      </form>
      <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-staal-tekst">
        <span className="data rounded-full border border-railstaal/60 px-2.5 py-0.5">Apple Pay</span>
        <span className="data rounded-full border border-railstaal/60 px-2.5 py-0.5">iDEAL</span>
        <span>· adres vul je in op de betaalpagina</span>
      </p>
      <div className="mt-5 flex items-center gap-3 text-xs text-staal-tekst">
        <span className="h-px flex-1 bg-railstaal/50" />
        of vul je gegevens zelf in
        <span className="h-px flex-1 bg-railstaal/50" />
      </div>
    </div>
  );
}
