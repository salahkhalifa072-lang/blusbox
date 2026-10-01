"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  pasKortingscodeToe,
  verwijderKortingscode,
  type KortingStaat,
} from "./acties";

function Knop({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="data shrink-0 rounded-full border border-antraciet px-4 py-2 text-xs transition-colors hover:bg-antraciet hover:text-kastwit disabled:opacity-60"
    >
      {pending ? "Bezig…" : label}
    </button>
  );
}

/**
 * Kortingscode invullen, los van het bestelformulier.
 *
 * Een eigen formulier en niet een veld in het grote formulier: dan zie je
 * de korting in het overzicht en op de betaalknop vóórdat je op betalen
 * drukt, in plaats van pas op de betaalpagina van Stripe.
 */
export function KortingscodeVeld({ actief }: { actief: string | null }) {
  const [staat, actie] = useActionState<KortingStaat, FormData>(
    pasKortingscodeToe,
    null,
  );

  if (actief) {
    return (
      <form
        action={verwijderKortingscode}
        className="flex items-center justify-between gap-3"
      >
        <p className="text-sm">
          Kortingscode <span className="data">{actief}</span> toegepast
        </p>
        <button
          type="submit"
          className="data text-xs text-staal-tekst underline underline-offset-4"
        >
          Verwijderen
        </button>
      </form>
    );
  }

  return (
    <form action={actie}>
      <label htmlFor="kortingscode" className="block text-sm font-medium">
        Kortingscode
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="kortingscode"
          name="kortingscode"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={staat?.fout ? true : undefined}
          aria-describedby={staat?.fout ? "kortingscode-fout" : undefined}
          className={`data w-full min-w-0 rounded-[var(--radius-control)] border bg-kastwit px-3 py-2 text-sm uppercase ${
            staat?.fout ? "border-blusrood-op-licht" : "border-railstaal"
          }`}
        />
        <Knop label="Toepassen" />
      </div>
      {staat?.fout ? (
        <p
          id="kortingscode-fout"
          role="alert"
          className="mt-1 text-sm text-blusrood-op-licht"
        >
          {staat.fout}
        </p>
      ) : null}
    </form>
  );
}
