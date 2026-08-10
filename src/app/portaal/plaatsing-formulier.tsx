"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registreerPlaatsing, type PlaatsingStaat } from "./acties";

const locaties = [
  { waarde: "woning", label: "Woning" },
  { waarde: "appartement", label: "Appartement" },
  { waarde: "bedrijfspand", label: "Bedrijfspand" },
  { waarde: "vve_algemene_ruimte", label: "VvE, algemene ruimte" },
  { waarde: "technische_ruimte", label: "Technische ruimte" },
  { waarde: "anders", label: "Anders" },
];

function Knop() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18] disabled:opacity-60"
    >
      {pending ? "Bezig…" : "Plaatsing vastleggen"}
    </button>
  );
}

function Veld({
  naam,
  label,
  fout,
  hint,
  ...rest
}: {
  naam: string;
  label: string;
  fout?: string;
  hint?: string;
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
        aria-describedby={fout ? `${naam}-fout` : hint ? `${naam}-hint` : undefined}
        className={`mt-1.5 w-full rounded-[var(--radius-control)] border bg-kastwit px-4 py-3 text-sm ${
          fout ? "border-blusrood-op-licht" : "border-railstaal"
        }`}
        {...rest}
      />
      {fout ? (
        <p id={`${naam}-fout`} className="mt-1 text-sm text-blusrood-op-licht">
          {fout}
        </p>
      ) : hint ? (
        <p id={`${naam}-hint`} className="mt-1 text-xs text-staal-tekst">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function PlaatsingFormulier({ lotNummers }: { lotNummers: string[] }) {
  const [staat, actie] = useActionState<PlaatsingStaat, FormData>(
    registreerPlaatsing,
    { fase: "leeg" },
  );
  const velden = staat.fase === "fout" ? (staat.velden ?? {}) : {};

  return (
    <form action={actie} className="space-y-4">
      {staat.fase === "gelukt" ? (
        <div
          role="status"
          className="rounded-xl border border-antraciet/30 bg-kastwit-dim p-4"
        >
          <p className="text-sm font-medium">Plaatsing vastgelegd</p>
          <p className="mt-1 text-sm text-staal-tekst">
            Module uit {staat.lotNummer} geregistreerd. Vervangdatum:{" "}
            <span className="data">{staat.vervaldatum}</span>. Je krijgt op
            twaalf, zes en één maand vooraf bericht, dat je kunt doorsturen naar
            je klant.
          </p>
        </div>
      ) : null}

      {staat.fase === "fout" && !staat.velden ? (
        <div
          role="alert"
          className="rounded-xl border border-signaal bg-signaal/15 p-4"
        >
          <p className="text-sm">{staat.melding}</p>
        </div>
      ) : null}

      <div>
        <label htmlFor="lotNummer" className="block text-sm font-medium">
          Lotnummer
        </label>
        <select
          id="lotNummer"
          name="lotNummer"
          required
          defaultValue=""
          className="data mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-4 py-3 text-sm"
        >
          <option value="" disabled>
            Kies het lotnummer…
          </option>
          {lotNummers.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-staal-tekst">
          Staat op de module en op de registratiekaart in de doos.
        </p>
      </div>

      <Veld
        naam="installatiedatum"
        label="Installatiedatum"
        type="date"
        required
        fout={velden.installatiedatum}
        hint="Hiermee start de termijn van tien jaar."
      />

      <div>
        <label htmlFor="locatieType" className="block text-sm font-medium">
          Locatietype
        </label>
        <select
          id="locatieType"
          name="locatieType"
          defaultValue="woning"
          className="mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-4 py-3 text-sm"
        >
          {locaties.map((l) => (
            <option key={l.waarde} value={l.waarde}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Veld
          naam="postcode"
          label="Postcode (optioneel)"
          placeholder="1011 AB"
          fout={velden.postcode}
        />
        <Veld
          naam="serienummer"
          label="Serienummer (optioneel)"
          fout={velden.serienummer}
        />
      </div>

      <Knop />
    </form>
  );
}
