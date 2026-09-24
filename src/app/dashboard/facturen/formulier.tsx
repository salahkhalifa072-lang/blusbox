"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { maakEnVerstuurFactuur, type FactuurStaat } from "./acties";

type Artikel = { slug: string; naam: string; prijs: string };

function Verstuurknop() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-antraciet px-6 py-2.5 text-sm text-kastwit transition-opacity hover:opacity-85 disabled:opacity-60"
    >
      {pending ? "Bezig…" : "Factuur maken en versturen"}
    </button>
  );
}

const invoerKlasse =
  "w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-3 py-2 text-sm";

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
      <label htmlFor={`f-${naam}`} className="data text-[11px] uppercase tracking-widest text-staal-tekst">
        {label}
      </label>
      <input
        id={`f-${naam}`}
        name={naam}
        aria-invalid={fout ? true : undefined}
        aria-describedby={fout ? `f-${naam}-fout` : undefined}
        className={`mt-1 ${invoerKlasse}`}
        {...rest}
      />
      {fout ? (
        <p id={`f-${naam}-fout`} className="mt-1 text-xs text-blusrood-op-licht">
          {fout}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Een balieverkoop invoeren.
 *
 * Na versturen verdwijnt het formulier en blijft alleen de bevestiging
 * staan, net als bij het klantbericht: anders is één extra klik genoeg voor
 * een tweede factuur met een nieuw nummer.
 */
export function FactuurFormulier({
  artikelen,
  vandaag,
}: {
  artikelen: Artikel[];
  vandaag: string;
}) {
  const [staat, actie] = useActionState<FactuurStaat, FormData>(
    maakEnVerstuurFactuur,
    { fase: "leeg" },
  );

  if (staat.fase === "klaar") {
    return (
      <div className="space-y-3 p-5">
        <p role="status" className="text-sm">{staat.melding}</p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/dashboard/facturen/${staat.factuurnummer}/pdf`}
            className="data rounded-full border border-antraciet px-4 py-1.5 text-xs"
          >
            Pdf bekijken
          </a>
          <a href="/dashboard/facturen" className="data rounded-full border border-antraciet px-4 py-1.5 text-xs">
            Nog een factuur
          </a>
        </div>
      </div>
    );
  }

  const f = staat.fase === "fout" ? (staat.velden ?? {}) : {};

  return (
    <form action={actie} className="grid gap-6 p-5 lg:grid-cols-2">
      <fieldset className="space-y-3">
        <legend className="font-medium">Klant</legend>
        <Veld naam="klantNaam" label="Naam" required autoComplete="off" fout={f.klantNaam} />
        <Veld naam="bedrijfsnaam" label="Bedrijfsnaam (optioneel)" autoComplete="off" />
        <Veld naam="email" label="E-mail" type="email" required autoComplete="off" fout={f.email} />
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <Veld naam="straat" label="Straat" required fout={f.straat} />
          <Veld naam="huisnummer" label="Huisnr." required fout={f.huisnummer} />
        </div>
        <div className="grid grid-cols-[8rem_1fr] gap-3">
          <Veld naam="postcode" label="Postcode" required fout={f.postcode} />
          <Veld naam="plaats" label="Plaats" required fout={f.plaats} />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-medium">Verkoop</legend>
        <Veld
          naam="leverdatum"
          label="Datum van verkoop"
          type="date"
          required
          defaultValue={vandaag}
          max={vandaag}
          fout={f.leverdatum}
        />
        {artikelen.map((a) => (
          <div key={a.slug} className="grid grid-cols-[1fr_5rem_7rem] items-end gap-3">
            <p className="pb-2 text-sm">{a.naam}</p>
            <Veld
              naam={`aantal-${a.slug}`}
              label="Aantal"
              type="number"
              min={0}
              max={500}
              defaultValue={a.slug === artikelen[0].slug ? 1 : 0}
              fout={f[`aantal-${a.slug}`]}
            />
            <Veld
              naam={`prijs-${a.slug}`}
              label="€ p/st incl."
              inputMode="decimal"
              defaultValue={a.prijs}
              fout={f[`prijs-${a.slug}`]}
            />
          </div>
        ))}
        <p className="text-xs leading-relaxed text-staal-tekst">
          Prijzen incl. 21% btw, zoals met de klant afgesproken. De factuur
          rekent netto en btw daaruit terug.
        </p>
      </fieldset>

      <div className="space-y-2 lg:col-span-2">
        <Verstuurknop />
        {staat.fase === "fout" ? (
          <p role="alert" className="text-sm text-blusrood-op-licht">{staat.melding}</p>
        ) : null}
      </div>
    </form>
  );
}
