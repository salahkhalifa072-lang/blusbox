"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { beantwoord, voegToe, type AntwoordStaat } from "./acties";

const LEEG: AntwoordStaat = { fase: "leeg" };
const waarde = (s: AntwoordStaat, naam: string, standaard = "") =>
  s.fase === "fout" ? (s.waarden?.[naam] ?? standaard) : standaard;
const veld =
  "w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-3 py-2.5 text-sm";

function Knop({ tekst, bezig }: { tekst: string; bezig: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-antraciet px-5 py-2.5 text-sm text-kastwit transition-opacity hover:opacity-85 disabled:opacity-60"
    >
      {pending ? bezig : tekst}
    </button>
  );
}

function Fout({ staat }: { staat: AntwoordStaat }) {
  if (staat.fase !== "fout") return null;
  return (
    <p role="alert" className="text-sm text-blusrood-op-licht">
      {staat.melding}
    </p>
  );
}

/**
 * Na versturen verdwijnt het formulier: blijft de tekst met de knop staan,
 * dan is één klik genoeg om hetzelfde antwoord twee keer te sturen.
 */
export function Antwoordformulier({
  id,
  email,
  onderwerp,
}: {
  id: string;
  email: string;
  onderwerp: string;
}) {
  const [staat, actie] = useActionState(beantwoord, LEEG);
  if (staat.fase === "klaar") {
    return (
      <p role="status" className="rounded-xl border border-antraciet/20 bg-kastwit-dim px-4 py-3 text-sm">
        {staat.melding} Reageert de klant, dan komt dat in je mailbox van info@blusbox.nl.
      </p>
    );
  }
  return (
    <form action={actie} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <p className="data text-xs text-staal-tekst">
        Aan {email} · vanaf info@blusbox.nl · de vraag van de klant staat eronder
      </p>
      <label htmlFor="onderwerp" className="sr-only">Onderwerp</label>
      <input id="onderwerp" name="onderwerp" required defaultValue={waarde(staat, "onderwerp", `Re: ${onderwerp}`)} className={veld} />
      <label htmlFor="tekst" className="sr-only">Antwoord</label>
      <textarea
        id="tekst"
        name="tekst"
        required
        rows={10}
        defaultValue={waarde(staat, "tekst")}
        placeholder="Typ hier je antwoord. Een lege regel begint een nieuwe alinea."
        className={veld}
      />
      <Fout staat={staat} />
      <Knop tekst="Versturen" bezig="Versturen…" />
    </form>
  );
}

export function Toevoegformulier() {
  const [staat, actie] = useActionState(voegToe, LEEG);
  return (
    <form action={actie} className="max-w-xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Naam
          <input name="naam" defaultValue={waarde(staat, "naam")} required className={`${veld} mt-1.5`} />
        </label>
        <label className="block text-sm">
          E-mailadres
          <input name="email" defaultValue={waarde(staat, "email")} type="email" required className={`${veld} mt-1.5`} />
        </label>
        <label className="block text-sm">
          Onderwerp
          <input name="onderwerp" defaultValue={waarde(staat, "onderwerp")} placeholder="Vraag over het product" className={`${veld} mt-1.5`} />
        </label>
        <label className="block text-sm">
          Ontvangen op
          <input name="datum" defaultValue={waarde(staat, "datum")} type="datetime-local" className={`${veld} mt-1.5`} />
        </label>
      </div>
      <label className="block text-sm">
        Bericht
        <textarea name="bericht" defaultValue={waarde(staat, "bericht")} required rows={8} placeholder="Plak hier het bericht van de klant." className={`${veld} mt-1.5`} />
      </label>
      <Fout staat={staat} />
      <Knop tekst="Toevoegen" bezig="Toevoegen…" />
    </form>
  );
}
