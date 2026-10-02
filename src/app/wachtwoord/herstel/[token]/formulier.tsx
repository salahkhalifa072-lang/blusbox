"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

export type HerstelStaat =
  | { fase: "leeg" }
  | { fase: "fout"; melding: string }
  | { fase: "klaar"; melding: string };

function Knop() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-blusrood-vlak px-6 py-3.5 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18] disabled:opacity-60"
    >
      {pending ? "Bezig…" : "Wachtwoord instellen"}
    </button>
  );
}

function Veld({
  naam,
  label,
  hulp,
}: {
  naam: string;
  label: string;
  hulp: string;
}) {
  return (
    <div>
      <label htmlFor={naam} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={naam}
        name={naam}
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        aria-describedby={`${naam}-hulp`}
        className="mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-4 py-3 text-sm"
      />
      <p id={`${naam}-hulp`} className="mt-1.5 text-xs text-staal-tekst">
        {hulp}
      </p>
    </div>
  );
}

/**
 * Twee velden, net als bij het aanmelden: een typefout in iets dat je
 * nergens terugziet merk je pas als je wil inloggen, en dan weet je niet
 * wat je verkeerd hebt getypt.
 */
export function HerstelFormulier({
  actie,
}: {
  actie: (vorige: HerstelStaat, formData: FormData) => Promise<HerstelStaat>;
}) {
  const [staat, verstuur] = useActionState<HerstelStaat, FormData>(actie, {
    fase: "leeg",
  });

  if (staat.fase === "klaar") {
    return (
      <div>
        <div
          role="status"
          className="rounded-2xl border border-railstaal/60 bg-kastwit-dim p-5"
        >
          <p className="text-sm font-medium">Gelukt</p>
          <p className="mt-2 text-sm leading-relaxed">{staat.melding}</p>
        </div>
        <Link
          href="/account"
          className="mt-6 inline-block rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
        >
          Naar inloggen
        </Link>
      </div>
    );
  }

  return (
    <form action={verstuur} className="space-y-5">
      {staat.fase === "fout" && (
        <div
          role="alert"
          className="rounded-2xl border border-signaal bg-signaal/15 p-4"
        >
          <p className="text-sm">{staat.melding}</p>
        </div>
      )}

      <Veld
        naam="wachtwoord"
        label="Nieuw wachtwoord"
        hulp="Minimaal 12 tekens."
      />
      <Veld
        naam="wachtwoordHerhaal"
        label="Herhaal het wachtwoord"
        hulp="Precies hetzelfde als hierboven."
      />

      <Knop />
    </form>
  );
}
