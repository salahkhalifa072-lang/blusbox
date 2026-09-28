"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { meldAan, type AanmeldStaat } from "@/app/affiliate/acties";

/**
 * Aanmeldformulier voor affiliates.
 *
 * Eén scherm, geen stappen. Een aanmelding in drie schermen ziet er
 * professioneel uit en kost de helft van de aanmeldingen; alles wat we
 * vragen past hier ruim onder elkaar.
 *
 * Elk veld dat niet strikt nodig is, is optioneel gemaakt. Wie nog geen
 * website heeft kan alsnog een goede partner zijn, en verplichte velden
 * die iemand niet kan invullen zijn een deur die dichtvalt.
 */

function Knop() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-blusrood-vlak px-8 py-3.5 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18] disabled:opacity-60"
    >
      {pending ? "Bezig met versturen…" : "Word Blusbox-affiliate"}
    </button>
  );
}

function Veld({
  naam,
  label,
  fout,
  hulp,
  ...rest
}: {
  naam: string;
  label: string;
  fout?: string;
  hulp?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={naam} className="block text-sm font-medium">
        {label}
        {!rest.required && (
          <span className="ml-1.5 text-xs font-normal text-staal-tekst">
            optioneel
          </span>
        )}
      </label>
      {hulp && <p className="mt-0.5 text-xs text-staal-tekst">{hulp}</p>}
      <input
        id={naam}
        name={naam}
        {...rest}
        aria-invalid={fout ? true : undefined}
        aria-describedby={fout ? `${naam}-fout` : undefined}
        className={`mt-1.5 w-full rounded-[var(--radius-control)] border bg-kastwit px-3 py-2.5 text-sm ${
          fout ? "border-blusrood" : "border-railstaal"
        }`}
      />
      {fout && (
        <p id={`${naam}-fout`} role="alert" className="mt-1 text-xs text-blusrood-op-licht">
          {fout}
        </p>
      )}
    </div>
  );
}

export function Aanmeldformulier() {
  const [staat, actie] = useActionState<AanmeldStaat, FormData>(meldAan, {
    fase: "leeg",
  });

  const velden = staat.fase === "fout" ? (staat.velden ?? {}) : {};

  if (staat.fase === "klaar") {
    return (
      <div className="rounded-2xl border border-railstaal bg-kastwit p-8">
        <p className="font-display text-2xl">Aanmelding ontvangen</p>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-staal-tekst">
          {staat.melding}
        </p>
        <Link
          href="/account"
          className="mt-6 inline-block rounded-full border border-antraciet px-6 py-3 text-sm transition-colors hover:bg-antraciet hover:text-kastwit"
        >
          Naar inloggen
        </Link>
      </div>
    );
  }

  return (
    <form action={actie} className="space-y-5">
      {staat.fase === "fout" && staat.melding && (
        <div
          role="alert"
          className="rounded-2xl border border-signaal bg-signaal/15 p-4 text-sm"
        >
          {staat.melding}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Veld naam="naam" label="Naam" required autoComplete="name" fout={velden.naam} />
        <Veld
          naam="email"
          label="E-mailadres"
          type="email"
          required
          autoComplete="email"
          fout={velden.email}
        />
      </div>

      <Veld
        naam="wachtwoord"
        label="Wachtwoord"
        type="password"
        required
        autoComplete="new-password"
        hulp="Minimaal 12 tekens. Hiermee log je straks in op je dashboard."
        fout={velden.wachtwoord}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Veld naam="bedrijfsnaam" label="Bedrijfsnaam" fout={velden.bedrijfsnaam} />
        <Veld
          naam="website"
          label="Website"
          type="url"
          placeholder="https://"
          fout={velden.website}
        />
      </div>

      <Veld
        naam="kanalen"
        label="Sociale kanalen"
        hulp="Bijvoorbeeld je Instagram, YouTube of LinkedIn."
        fout={velden.kanalen}
      />

      <div>
        <label htmlFor="promotiemethode" className="block text-sm font-medium">
          Hoe wil je Blusbox promoten?
        </label>
        <p className="mt-0.5 text-xs text-staal-tekst">
          Een paar zinnen is genoeg. Dit is waar we naar kijken bij de
          beoordeling.
        </p>
        <textarea
          id="promotiemethode"
          name="promotiemethode"
          required
          rows={4}
          aria-invalid={velden.promotiemethode ? true : undefined}
          className={`mt-1.5 w-full rounded-[var(--radius-control)] border bg-kastwit px-3 py-2.5 text-sm ${
            velden.promotiemethode ? "border-blusrood" : "border-railstaal"
          }`}
        />
        {velden.promotiemethode && (
          <p role="alert" className="mt-1 text-xs text-blusrood-op-licht">
            {velden.promotiemethode}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="landcode" className="block text-sm font-medium">
            Land
          </label>
          <select
            id="landcode"
            name="landcode"
            defaultValue="NL"
            className="data mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-3 py-2.5 text-sm"
          >
            <option value="NL">Nederland</option>
            <option value="BE">België</option>
            <option value="DE">Duitsland</option>
            <option value="OV">Anders</option>
          </select>
        </div>
        <div>
          <label htmlFor="uitbetaalmethode" className="block text-sm font-medium">
            Uitbetaling
          </label>
          <select
            id="uitbetaalmethode"
            name="uitbetaalmethode"
            defaultValue="bank"
            className="data mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-3 py-2.5 text-sm"
          >
            <option value="bank">Bankoverschrijving</option>
            <option value="verrekening">Verrekenen met een factuur</option>
          </select>
        </div>
      </div>

      <Veld
        naam="slug"
        label="Gewenste naam in je link"
        hulp="blusbox.nl/r/… — kleine letters, cijfers en koppeltekens. Laat leeg en wij stellen iets voor."
        placeholder="jouw-naam"
        fout={velden.slug}
      />

      <div className="rounded-2xl border border-railstaal/60 bg-kastwit-dim p-4">
        <label className="flex gap-3 text-sm">
          <input
            type="checkbox"
            name="akkoord"
            value="ja"
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span>
            Ik ga akkoord met de{" "}
            <Link href="/affiliate/voorwaarden" className="underline underline-offset-4">
              affiliatevoorwaarden
            </Link>{" "}
            en de{" "}
            <Link href="/privacyverklaring" className="underline underline-offset-4">
              privacyverklaring
            </Link>
            .
          </span>
        </label>
        {velden.akkoord && (
          <p role="alert" className="mt-2 text-xs text-blusrood-op-licht">
            {velden.akkoord}
          </p>
        )}
      </div>

      <Knop />
    </form>
  );
}
