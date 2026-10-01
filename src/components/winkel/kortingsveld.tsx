"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  haalKortingWeg,
  pasKortingToe,
  type KortingStaat,
} from "@/app/afrekenen/korting-acties";
import { toonPercentage } from "@/lib/korting";

/**
 * Het kortingscodeveld in de bestellingssamenvatting.
 *
 * Standaard dichtgeklapt achter een link. Een open invoerveld met
 * "kortingscode" erboven is een bekende lekkage: wie er geen heeft gaat
 * er een zoeken, verlaat de afrekenpagina en komt vaak niet terug. Wie
 * een code heeft gekregen weet dat hij hem ergens moet invullen en vindt
 * de link.
 *
 * Het veld staat wél open zodra er een code is toegepast, want dan moet
 * zichtbaar zijn wat er is verrekend en hoe je het terugdraait.
 */

function Toepasknop() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="data shrink-0 rounded-full border border-antraciet px-4 py-2 text-xs transition-colors hover:bg-antraciet hover:text-kastwit disabled:opacity-60"
    >
      {pending ? "Bezig…" : "Toepassen"}
    </button>
  );
}

function Weghaalknop() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="data text-xs underline underline-offset-4 hover:text-staal-tekst disabled:opacity-60"
    >
      {pending ? "Bezig…" : "Weghalen"}
    </button>
  );
}

export function Kortingsveld({
  toegepast,
}: {
  /** De code die nu geldt, met zijn percentage; null als er geen is. */
  toegepast: { code: string; percentageBp: number } | null;
}) {
  const [staat, actie] = useActionState<KortingStaat, FormData>(pasKortingToe, {
    fase: "leeg",
  });

  if (toegepast) {
    return (
      <div className="hairline-t mt-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm">
            <span className="data uppercase">{toegepast.code}</span>{" "}
            <span className="text-staal-tekst">
              — {toonPercentage(toegepast.percentageBp)} korting
            </span>
          </p>
          <form action={haalKortingWeg}>
            <Weghaalknop />
          </form>
        </div>
      </div>
    );
  }

  return (
    <details className="hairline-t mt-4 pt-4">
      <summary className="data cursor-pointer list-none text-xs underline underline-offset-4 hover:text-staal-tekst">
        Ik heb een kortingscode
      </summary>

      <form action={actie} className="mt-3 flex gap-2">
        <label htmlFor="kortingscode" className="sr-only">
          Kortingscode
        </label>
        <input
          id="kortingscode"
          name="code"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Kortingscode"
          aria-describedby={staat.fase !== "leeg" ? "korting-melding" : undefined}
          aria-invalid={staat.fase === "fout" || undefined}
          className="data min-w-0 flex-1 rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-3 py-2 text-sm uppercase placeholder:normal-case placeholder:text-staal-tekst"
        />
        <Toepasknop />
      </form>

      {staat.fase !== "leeg" && (
        <p
          id="korting-melding"
          role="status"
          className={`mt-2 text-xs ${
            staat.fase === "fout" ? "text-blusrood-op-licht" : "text-staal-tekst"
          }`}
        >
          {staat.melding}
        </p>
      )}
    </details>
  );
}
