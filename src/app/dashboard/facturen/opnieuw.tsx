"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { verstuurFactuurOpnieuw, type OpnieuwStaat } from "./acties";

function Knop() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="data rounded-full border border-antraciet px-3 py-1 text-xs transition-colors hover:bg-antraciet hover:text-kastwit disabled:opacity-60"
    >
      {pending ? "Bezig…" : "Opnieuw versturen"}
    </button>
  );
}

export function Opnieuw({ factuurnummer }: { factuurnummer: string }) {
  const [staat, actie] = useActionState<OpnieuwStaat, FormData>(
    verstuurFactuurOpnieuw,
    { fase: "leeg" },
  );

  // Na een geslaagde verzending geen knop meer: één klik te veel is dan
  // een tweede factuurmail in de inbox van de klant.
  if (staat.fase === "klaar") {
    return <p role="status" className="data text-xs text-staal-tekst">{staat.melding}</p>;
  }

  return (
    <form action={actie} className="space-y-1">
      <input type="hidden" name="factuurnummer" value={factuurnummer} />
      <Knop />
      {staat.fase === "fout" ? (
        <p role="alert" className="text-xs text-blusrood-op-licht">{staat.melding}</p>
      ) : null}
    </form>
  );
}
