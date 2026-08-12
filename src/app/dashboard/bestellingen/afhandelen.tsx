"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  markeerGeleverd,
  markeerVerzonden,
  type AfhandelStaat,
} from "./acties";

function Knop({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="data rounded-full border border-antraciet px-3 py-1 text-xs transition-colors hover:bg-antraciet hover:text-kastwit disabled:opacity-60"
    >
      {pending ? "Bezig…" : label}
    </button>
  );
}

/**
 * Afhandeling per bestelling.
 *
 * Het track-and-tracenummer is optioneel: niet elke zending heeft er een op
 * het moment dat iemand hier op de knop drukt, en dan is "verzonden zonder
 * nummer" beter dan "nog niet verzonden".
 */
export function Afhandelen({
  ordernummer,
  status,
  verzonden,
  geleverd,
}: {
  ordernummer: string;
  status: string;
  verzonden: boolean;
  geleverd: boolean;
}) {
  const [verzendStaat, verzendActie] = useActionState<AfhandelStaat, FormData>(
    markeerVerzonden,
    { fase: "leeg" },
  );
  const [bezorgStaat, bezorgActie] = useActionState<AfhandelStaat, FormData>(
    markeerGeleverd,
    { fase: "leeg" },
  );

  const staat =
    verzendStaat.fase !== "leeg" ? verzendStaat : bezorgStaat;

  if (status === "nieuw") {
    return (
      <span className="data text-xs text-staal-tekst">wacht op betaling</span>
    );
  }

  return (
    <div className="space-y-1.5">
      {!verzonden ? (
        <form action={verzendActie} className="flex items-center gap-1.5">
          <input type="hidden" name="ordernummer" value={ordernummer} />
          <label className="sr-only" htmlFor={`tt-${ordernummer}`}>
            Zendingnummer voor {ordernummer}
          </label>
          <input
            id={`tt-${ordernummer}`}
            name="trackAndTrace"
            placeholder="zendingnr."
            className="data w-28 rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-2 py-1 text-xs"
          />
          <Knop label="Verzonden" />
        </form>
      ) : !geleverd ? (
        <form action={bezorgActie}>
          <input type="hidden" name="ordernummer" value={ordernummer} />
          <Knop label="Geleverd" />
        </form>
      ) : (
        <span className="data text-xs text-staal-tekst">afgehandeld</span>
      )}

      {staat.fase === "fout" ? (
        <p role="alert" className="text-xs text-blusrood-op-licht">
          {staat.melding}
        </p>
      ) : null}
      {staat.fase === "klaar" ? (
        <p role="status" className="text-xs text-staal-tekst">
          {staat.melding}
        </p>
      ) : null}
    </div>
  );
}
