"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { stuurContactbericht, type ContactStaat } from "./acties";

const VELD =
  "mt-1.5 w-full rounded-[var(--radius-control)] border bg-kastwit px-4 py-3 text-sm";

function Knop() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-blusrood-vlak px-7 py-3.5 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18] disabled:opacity-60"
    >
      {pending ? "Bezig…" : "Versturen"}
    </button>
  );
}

function Fout({ id, tekst }: { id: string; tekst?: string }) {
  if (!tekst) return null;
  return (
    <p id={id} className="mt-1 text-sm text-blusrood-op-licht">
      {tekst}
    </p>
  );
}

export function ContactFormulier() {
  const [staat, actie] = useActionState<ContactStaat, FormData>(
    stuurContactbericht,
    { fase: "leeg" },
  );
  const begonnen = useRef<HTMLInputElement>(null);

  // Pas in de browser: de server kent het moment niet waarop iemand de
  // pagina opende, en een bot die alleen de html post, vult dit niet.
  useEffect(() => {
    if (begonnen.current) begonnen.current.value = String(Date.now());
  }, []);

  if (staat.fase === "gelukt") {
    return (
      <div
        role="status"
        className="h-fit rounded-2xl border border-railstaal/50 bg-kastwit p-8"
      >
        <h2 className="font-display text-2xl">Bericht verstuurd</h2>
        <p className="mt-3 text-staal-tekst">
          Bedankt. We reageren binnen één werkdag op het e-mailadres dat je
          hebt opgegeven. Gaat je vraag over de plaatsing? Stuur dan als
          antwoord op onze mail een foto van je open meterkast mee.
        </p>
      </div>
    );
  }

  const velden = staat.fase === "fout" ? (staat.velden ?? {}) : {};
  const w = staat.fase === "fout" ? (staat.waarden ?? {}) : {};
  const rand = (veld: string) =>
    velden[veld] ? "border-blusrood-op-licht" : "border-railstaal";

  return (
    // key: na een fout opnieuw opbouwen, zodat de ingevulde waarden terugkomen.
    <form
      key={staat.fase === "fout" ? JSON.stringify(w) : "leeg"}
      action={actie}
      className="space-y-5"
      noValidate
    >
      {staat.fase === "fout" ? (
        <div role="alert" className="rounded-2xl border border-signaal bg-signaal/15 p-4">
          <p className="text-sm font-medium">{staat.melding}</p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="naam" className="block text-sm font-medium">
            Naam
          </label>
          <input
            id="naam"
            name="naam"
            type="text"
            autoComplete="name"
            required
            defaultValue={w.naam}
            aria-invalid={velden.naam ? true : undefined}
            aria-describedby={velden.naam ? "naam-fout" : undefined}
            className={`${VELD} ${rand("naam")}`}
          />
          <Fout id="naam-fout" tekst={velden.naam} />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            E-mailadres
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={w.email}
            aria-invalid={velden.email ? true : undefined}
            aria-describedby={velden.email ? "email-fout" : undefined}
            className={`${VELD} ${rand("email")}`}
          />
          <Fout id="email-fout" tekst={velden.email} />
        </div>
      </div>

      <div>
        <label htmlFor="onderwerp" className="block text-sm font-medium">
          Onderwerp
        </label>
        <select
          id="onderwerp"
          name="onderwerp"
          defaultValue={w.onderwerp ?? "vraag"}
          className={`${VELD} border-railstaal`}
        >
          <option value="vraag">Vraag over het product</option>
          <option value="plaatsing">Past het in mijn meterkast?</option>
          <option value="zakelijk">Zakelijke offerte</option>
          <option value="dealer">Dealeraccount aanvragen</option>
          <option value="bestelling">Vraag over een bestelling</option>
        </select>
      </div>

      <div>
        <label htmlFor="bericht" className="block text-sm font-medium">
          Bericht
        </label>
        <textarea
          id="bericht"
          name="bericht"
          rows={6}
          required
          maxLength={5000}
          defaultValue={w.bericht}
          aria-invalid={velden.bericht ? true : undefined}
          aria-describedby={velden.bericht ? "bericht-fout" : "bericht-tip"}
          className={`${VELD} ${rand("bericht")}`}
        />
        <Fout id="bericht-fout" tekst={velden.bericht} />
        <p id="bericht-tip" className="mt-1.5 text-xs text-staal-tekst">
          Gaat je vraag over de plaatsing of een bestelling? Vermeld je
          bestelnummer, of stuur na ons antwoord een foto van je open
          meterkast mee.
        </p>
      </div>

      {/* Lokaas voor bots: onzichtbaar en buiten de tabvolgorde. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input ref={begonnen} type="hidden" name="begonnen" />

      <Knop />
    </form>
  );
}
