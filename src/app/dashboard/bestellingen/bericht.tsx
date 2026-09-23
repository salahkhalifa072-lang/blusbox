"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { stuurKlantbericht, type AfhandelStaat } from "./acties";

/**
 * Een bericht typen aan de klant van deze bestelling.
 *
 * Dichtgeklapt tot je hem nodig hebt: op de bestellingenpagina staan
 * tweehonderd rijen, en een openstaand tekstvak per rij maakt de tabel
 * onleesbaar.
 *
 * Na een geslaagde verzending verdwijnt het formulier en blijft alleen de
 * bevestiging staan. Dat is niet netheid maar een rem: blijft de getypte
 * tekst staan met de knop eronder, dan is één klik genoeg om dezelfde mail
 * een tweede keer te sturen.
 */

function Verstuurknop() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="data rounded-full bg-antraciet px-4 py-1.5 text-xs text-kastwit transition-opacity hover:opacity-85 disabled:opacity-60"
    >
      {pending ? "Versturen…" : "Versturen"}
    </button>
  );
}

export function Bericht({
  ordernummer,
  email,
}: {
  ordernummer: string;
  email: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [staat, actie] = useActionState<AfhandelStaat, FormData>(
    stuurKlantbericht,
    { fase: "leeg" },
  );

  if (!email) {
    return (
      <span className="data text-xs text-staal-tekst">geen e-mailadres</span>
    );
  }

  if (staat.fase === "klaar") {
    return (
      <p className="data text-xs text-staal-tekst">{staat.melding}</p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="data rounded-full border border-antraciet px-3 py-1 text-xs transition-colors hover:bg-antraciet hover:text-kastwit"
      >
        Bericht
      </button>
    );
  }

  return (
    <form action={actie} className="w-72 space-y-2">
      <input type="hidden" name="ordernummer" value={ordernummer} />

      <p className="data text-[11px] text-staal-tekst">
        Aan {email}, vanaf info@blusbox.nl
      </p>

      <label className="sr-only" htmlFor={`onderwerp-${ordernummer}`}>
        Onderwerp
      </label>
      <input
        id={`onderwerp-${ordernummer}`}
        name="onderwerp"
        type="text"
        required
        placeholder="Onderwerp"
        defaultValue={`Over je bestelling ${ordernummer}`}
        className="w-full data rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-2 py-1.5 text-xs"
      />

      <label className="sr-only" htmlFor={`bericht-${ordernummer}`}>
        Bericht
      </label>
      <textarea
        id={`bericht-${ordernummer}`}
        name="bericht"
        required
        rows={6}
        placeholder="Typ hier je bericht aan de klant."
        className="w-full data rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-2 py-1.5 text-xs"
      />

      <div className="flex items-center gap-2">
        <Verstuurknop />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="data text-xs text-staal-tekst underline"
        >
          Annuleren
        </button>
      </div>

      {staat.fase === "fout" && (
        <p className="data text-xs text-blusrood-op-licht" role="alert">
          {staat.melding}
        </p>
      )}
    </form>
  );
}
