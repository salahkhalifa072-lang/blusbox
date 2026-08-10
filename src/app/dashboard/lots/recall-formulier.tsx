"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { openRecall, type RecallStaat } from "./acties";

function Knop() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18] disabled:opacity-60"
    >
      {pending ? "Bezig…" : "Recall openen"}
    </button>
  );
}

export function RecallFormulier({ lotNummers }: { lotNummers: string[] }) {
  const [staat, actie] = useActionState<RecallStaat, FormData>(openRecall, {
    fase: "leeg",
  });

  return (
    <form action={actie} className="space-y-4 p-5">
      {staat.fase === "gelukt" ? (
        <div
          role="status"
          className="rounded-xl border border-antraciet/30 bg-kastwit-dim p-4"
        >
          <p className="text-sm font-medium">
            Recall geopend voor {staat.lotNummer}
          </p>
          <p className="mt-1 text-sm text-staal-tekst">
            {staat.aangeschreven} afnemer
            {staat.aangeschreven === 1 ? "" : "s"} op de lijst gezet. De
            berichten staan klaar in het recalloverzicht.
          </p>
        </div>
      ) : null}

      {staat.fase === "fout" ? (
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
            Kies een lot…
          </option>
          {lotNummers.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="reden" className="block text-sm font-medium">
          Reden
        </label>
        <textarea
          id="reden"
          name="reden"
          rows={3}
          required
          minLength={10}
          className="mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-4 py-3 text-sm"
        />
        <p className="mt-1.5 text-xs text-staal-tekst">
          Deze tekst gaat mee in het bericht aan de afnemers. Schrijf hem zoals
          een klant hem moet lezen.
        </p>
      </div>

      <Knop />
    </form>
  );
}
