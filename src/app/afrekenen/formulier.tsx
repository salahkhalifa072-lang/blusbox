"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { rekenAf, type AfrekenFout } from "./acties";
import { LANDKEUZE } from "@/lib/verzending";

function Verzendknop({ bedrag }: { bedrag: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-blusrood-vlak px-7 py-4 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18] disabled:opacity-60"
    >
      {pending ? "Bezig…" : `Betalen — ${bedrag}`}
    </button>
  );
}

function Veld({
  naam,
  label,
  fout,
  ...rest
}: {
  naam: string;
  label: string;
  fout?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={naam} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={naam}
        name={naam}
        aria-invalid={fout ? true : undefined}
        aria-describedby={fout ? `${naam}-fout` : undefined}
        className={`mt-1.5 w-full rounded-[var(--radius-control)] border bg-kastwit px-4 py-3 text-sm ${
          fout ? "border-blusrood-op-licht" : "border-railstaal"
        }`}
        {...rest}
      />
      {/* §12: the error sits next to its field and is linked to it */}
      {fout ? (
        <p id={`${naam}-fout`} className="mt-1 text-sm text-blusrood-op-licht">
          {fout}
        </p>
      ) : null}
    </div>
  );
}

export function AfrekenFormulier({ bedrag }: { bedrag: string }) {
  const [staat, actie] = useActionState<AfrekenFout | null, FormData>(
    rekenAf,
    null,
  );
  const [zakelijk, setZakelijk] = useState(false);
  const fout = staat?.velden ?? {};

  return (
    <form action={actie} className="space-y-6">
      {staat?.algemeen ? (
        <div
          role="alert"
          className="rounded-2xl border border-signaal bg-signaal/15 p-4"
        >
          <p className="text-sm font-medium">Bestelling niet geplaatst</p>
          <p className="mt-1 text-sm">{staat.algemeen}</p>
          {staat.oplossing ? (
            <p className="mt-2 text-sm">{staat.oplossing}</p>
          ) : null}
        </div>
      ) : null}

      <fieldset className="space-y-4">
        <legend className="font-display text-xl">Contact</legend>
        <Veld
          naam="email"
          label="E-mailadres"
          type="email"
          autoComplete="email"
          required
          fout={fout.email}
        />
        <p className="text-xs text-staal-tekst">
          Hierop ontvang je de bevestiging, de factuur en later de
          vervangingsherinnering.
        </p>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-display text-xl">Bezorgadres</legend>

        <div>
          <label htmlFor="landcode" className="block text-sm font-medium">
            Land
          </label>
          <select
            id="landcode"
            name="landcode"
            defaultValue="NL"
            className="mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-4 py-3 text-sm"
          >
            {LANDKEUZE.map((l) => (
              <option key={l.code} value={l.code}>
                {l.naam}
              </option>
            ))}
          </select>
        </div>

        {/* NL convention: postcode + huisnummer first, street after */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Veld
            naam="postcode"
            label="Postcode"
            autoComplete="postal-code"
            placeholder="1011 AB"
            required
            fout={fout.postcode}
          />
          <Veld
            naam="huisnummer"
            label="Huisnummer"
            placeholder="12A"
            required
            fout={fout.huisnummer}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Veld
            naam="straat"
            label="Straat"
            autoComplete="address-line1"
            fout={fout.straat}
          />
          <Veld
            naam="plaats"
            label="Plaats"
            autoComplete="address-level2"
            fout={fout.plaats}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-display text-xl">Zakelijk bestellen</legend>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="zakelijk"
            value="ja"
            checked={zakelijk}
            onChange={(e) => setZakelijk(e.target.checked)}
            className="h-4 w-4"
          />
          Ik bestel namens een bedrijf
        </label>

        {zakelijk ? (
          <div className="space-y-4">
            <Veld
              naam="bedrijfsnaam"
              label="Bedrijfsnaam"
              autoComplete="organization"
              fout={fout.bedrijfsnaam}
            />
            <Veld
              naam="btwId"
              label="Btw-identificatienummer (optioneel)"
              placeholder="NL123456789B01"
              fout={fout.btwId}
            />
            <p className="text-xs text-staal-tekst">
              Bij een geldig btw-nummer uit een ander EU-land verleggen wij de
              btw. Binnen Nederland rekenen wij gewoon btw.
            </p>
          </div>
        ) : null}
      </fieldset>

      <Verzendknop bedrag={bedrag} />

      <p className="text-xs leading-relaxed text-staal-tekst">
        Door te bestellen ga je akkoord met de algemene voorwaarden. Je hebt
        veertien dagen bedenktijd. Verzending is gratis.
      </p>
    </form>
  );
}
