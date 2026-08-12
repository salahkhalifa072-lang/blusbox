"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  verstuurTerugroepberichten,
  type VerzendStaat,
} from "./acties";

function Knop({ aantal }: { aantal: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="data rounded-full bg-blusrood-vlak px-4 py-1.5 text-xs text-kastwit transition-colors hover:bg-[#9e1b18] disabled:opacity-60"
    >
      {pending ? "Bezig met versturen…" : `Verstuur ${aantal} bericht${aantal === 1 ? "" : "en"}`}
    </button>
  );
}

/**
 * Versturen van de openstaande terugroepberichten.
 *
 * De uitkomst blijft staan in plaats van te verdwijnen achter een
 * bevestiging: als er adressen mislukken, moet iemand ze kunnen overtypen
 * en nabellen. Dat is bij een terugroepactie het verschil tussen een
 * afnemer die gewaarschuwd is en een die dat niet is.
 */
export function Verzendknop({
  recallId,
  openstaand,
}: {
  recallId: string;
  openstaand: number;
}) {
  const [staat, actie] = useActionState<VerzendStaat, FormData>(
    verstuurTerugroepberichten,
    { fase: "leeg" },
  );

  return (
    <div className="space-y-2">
      {openstaand > 0 ? (
        <form action={actie}>
          <input type="hidden" name="recallId" value={recallId} />
          <Knop aantal={openstaand} />
        </form>
      ) : (
        <span className="data text-xs text-staal-tekst">alles verstuurd</span>
      )}

      {staat.fase === "fout" ? (
        <p role="alert" className="text-xs text-blusrood-op-licht">
          {staat.melding}
        </p>
      ) : null}

      {staat.fase === "klaar" ? (
        <div role="status" className="space-y-1">
          <p className="data text-xs">
            {staat.verstuurd} verstuurd
            {staat.mislukt > 0 ? `, ${staat.mislukt} mislukt` : ""}
          </p>
          {staat.problemen.length > 0 ? (
            <ul className="space-y-0.5">
              {staat.problemen.map((p) => (
                <li key={p.email} className="text-xs text-blusrood-op-licht">
                  <span className="data">{p.email}</span> — {p.reden}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
