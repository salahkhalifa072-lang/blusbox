"use client";

import { useActionState, useState } from "react";
import { pasKortingToe } from "./artikelen";
import { useFormStatus } from "react-dom";
import { startDeurverkoop, type VerkoopStaat } from "./acties";

type Artikel = { slug: string; naam: string; prijs: string; prijsCenten: number };

const euro = (c: number) => `€ ${(c / 100).toFixed(2).replace(".", ",")}`;
/** Zelfde lezing als op de server (lib/factuur leesBedrag), zonder de import. */
function centen(invoer: string): number | null {
  const schoon = invoer.replace(/[€\s]/g, "").replace(",", ".");
  if (!schoon) return 0;
  return /^\d+(\.\d{1,2})?$/.test(schoon) ? Math.round(Number(schoon) * 100) : null;
}

const invoer =
  "mt-1 w-full rounded-xl border border-railstaal bg-kastwit px-3.5 py-3 text-base";

function Veld({
  naam,
  label,
  fout,
  ...rest
}: { naam: string; label: string; fout?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={`v-${naam}`} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={`v-${naam}`}
        name={naam}
        aria-invalid={fout ? true : undefined}
        className={`${invoer} ${fout ? "border-blusrood-op-licht" : ""}`}
        {...rest}
      />
      {fout && <p className="mt-1 text-xs text-blusrood-op-licht">{fout}</p>}
    </div>
  );
}

function Knop() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-blusrood-vlak px-6 py-4 text-base font-semibold text-kastwit disabled:opacity-60"
    >
      {pending ? "Betaling klaarzetten…" : "Naar betalen →"}
    </button>
  );
}

/**
 * Nieuwe verkoop. Na "Naar betalen" opent het betaalscherm met de QR-code.
 *
 * Velden met autocomplete uit, behalve waar het helpt: dit is de telefoon
 * van de verkoper, en zijn eigen adres wil hij niet bij elke klant
 * voorgesteld krijgen.
 */
export function VerkoopFormulier({
  artikelen,
  maxProcent,
}: {
  artikelen: Artikel[];
  /** null voor de admin: geen grens. */
  maxProcent: number | null;
}) {
  const [staat, actie] = useActionState<VerkoopStaat, FormData>(startDeurverkoop, { fase: "leeg" });
  const v = staat.fase === "fout" ? (staat.velden ?? {}) : {};
  const w = staat.fase === "fout" ? (staat.waarden ?? {}) : {};

  // Alleen voor het totaal op het scherm; de server rekent zelf opnieuw.
  const [aantallen, setAantallen] = useState<Record<string, number>>(() =>
    Object.fromEntries(artikelen.map((a) => [a.slug, Number(w[`aantal-${a.slug}`] ?? (a.slug === "blusbox" ? 1 : 0)) || 0])),
  );
  const [korting, setKorting] = useState(w.korting ?? "");
  const regels = artikelen.map((a) => ({ slug: a.slug, aantal: aantallen[a.slug] ?? 0, stukprijsInclBtwCenten: a.prijsCenten }));
  const vol = regels.reduce((t, r) => t + r.aantal * r.stukprijsInclBtwCenten, 0);
  const gevraagd = centen(korting);
  const berekend = pasKortingToe(regels, gevraagd ?? 0);
  const teVeel = maxProcent !== null && gevraagd !== null && gevraagd * 100 > vol * maxProcent;

  return (
    <form
      action={actie}
      key={staat.fase === "fout" ? JSON.stringify(w) : "leeg"}
      className="space-y-5"
      autoComplete="off"
    >
      {staat.fase === "fout" && (
        <p role="alert" className="rounded-2xl border border-signaal bg-signaal/15 p-4 text-sm font-medium">
          {staat.melding}
        </p>
      )}

      <fieldset className="rounded-3xl bg-kastwit p-5">
        <legend className="sr-only">Artikelen</legend>
        <p className="text-sm font-medium">Wat neemt de klant?</p>
        <div className="mt-3 space-y-3">
          {artikelen.map((a) => (
            <div key={a.slug} className="flex items-center justify-between gap-3">
              <label htmlFor={`v-aantal-${a.slug}`} className="min-w-0">
                <span className="block truncate">{a.naam}</span>
                <span className="data text-xs text-staal-tekst">{a.prijs} per stuk, incl. btw</span>
              </label>
              <input
                id={`v-aantal-${a.slug}`}
                name={`aantal-${a.slug}`}
                type="number"
                inputMode="numeric"
                min={0}
                max={50}
                defaultValue={w[`aantal-${a.slug}`] ?? (a.slug === "blusbox" ? "1" : "0")}
                onChange={(e) => setAantallen((x) => ({ ...x, [a.slug]: Math.max(0, Number(e.target.value) || 0) }))}
                className="data w-20 rounded-xl border border-railstaal bg-kastwit px-3 py-2.5 text-center text-base"
              />
            </div>
          ))}
        </div>
        {v["aantal-blusbox"] && <p className="mt-2 text-xs text-blusrood-op-licht">{v["aantal-blusbox"]}</p>}

        <div className="mt-4 border-t border-railstaal/40 pt-4">
          <label htmlFor="v-korting" className="flex items-center justify-between gap-3">
            <span>
              <span className="block text-sm">Korting</span>
              <span className="data text-xs text-staal-tekst">
                in euro{maxProcent !== null ? `, maximaal ${maxProcent}%` : ""}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="data text-staal-tekst">€</span>
              <input
                id="v-korting"
                name="korting"
                inputMode="decimal"
                placeholder="0"
                value={korting}
                onChange={(e) => setKorting(e.target.value)}
                className={`data w-20 rounded-xl border bg-kastwit px-3 py-2.5 text-center text-base ${
                  v.korting || teVeel || gevraagd === null ? "border-blusrood-op-licht" : "border-railstaal"
                }`}
              />
            </span>
          </label>
          {(v.korting || teVeel) && (
            <p className="mt-1 text-xs text-blusrood-op-licht">
              {v.korting ?? `Maximaal ${maxProcent}%: ${euro(Math.floor((vol * (maxProcent ?? 0)) / 100))}.`}
            </p>
          )}
        </div>

        {/* Het bedrag dat de klant gaat betalen, voordat er op betalen wordt gedrukt. */}
        <div className="mt-4 flex items-baseline justify-between rounded-2xl bg-kastwit-dim px-4 py-3">
          <span className="text-sm">Totaal</span>
          <span className="text-right">
            {berekend.kortingCenten > 0 && (
              <span className="data mr-2 text-sm text-staal-tekst line-through">{euro(vol)}</span>
            )}
            <span className="data text-2xl">{euro(berekend.totaalCenten)}</span>
          </span>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-3xl bg-kastwit p-5">
        <legend className="sr-only">Klant</legend>
        <p className="text-sm font-medium">Gegevens van de klant</p>
        <Veld naam="klantNaam" label="Naam" fout={v.klantNaam} defaultValue={w.klantNaam} autoCapitalize="words" />
        <Veld naam="email" label="E-mailadres (voor de factuur)" type="email" inputMode="email" autoCapitalize="none" fout={v.email} defaultValue={w.email} />
        <div className="grid grid-cols-[1fr_6rem] gap-3">
          <Veld naam="postcode" label="Postcode" autoCapitalize="characters" fout={v.postcode} defaultValue={w.postcode} />
          <Veld naam="huisnummer" label="Huisnr." fout={v.huisnummer} defaultValue={w.huisnummer} />
        </div>
        <Veld naam="straat" label="Straat" fout={v.straat} defaultValue={w.straat} autoCapitalize="words" />
        <Veld naam="plaats" label="Plaats" fout={v.plaats} defaultValue={w.plaats} autoCapitalize="words" />
        <Veld naam="bedrijfsnaam" label="Bedrijfsnaam (alleen als het een bedrijf is)" defaultValue={w.bedrijfsnaam} />
      </fieldset>

      {/* Wettelijk: bij verkoop aan de deur moet de klant vóór de koop
          weten dat hij 14 dagen bedenktijd heeft. Het vinkje is geen
          formaliteit maar het moment waarop de verkoper het zegt. */}
      <label className="flex gap-3 rounded-3xl bg-kastwit p-5 text-sm">
        <input type="checkbox" name="bedenktijd" value="ja" className="mt-0.5 h-5 w-5 shrink-0 accent-[#b01a17]" defaultChecked={w.bedenktijd === "ja"} />
        <span>
          Ik heb de klant verteld dat hij <strong>14 dagen bedenktijd</strong> heeft en dat de factuur
          met het herroepingsformulier per mail komt.
          {v.bedenktijd && <span className="mt-1 block text-xs text-blusrood-op-licht">{v.bedenktijd}</span>}
        </span>
      </label>

      <Knop />
    </form>
  );
}
