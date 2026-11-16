"use client";

import { useActionState } from "react";
import { voegVerkoperToe, type VerkoperStaat } from "./acties";

export function VerkoperFormulier() {
  const [staat, actie, bezig] = useActionState<VerkoperStaat, FormData>(voegVerkoperToe, { fase: "leeg" });
  return (
    <form action={actie} className="grid gap-3 rounded-2xl bg-kastwit p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="text-sm">
        Naam
        <input name="naam" className="mt-1 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-3 py-2" />
      </label>
      <label className="text-sm">
        E-mailadres
        <input name="email" type="email" required className="mt-1 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-3 py-2" />
      </label>
      <button type="submit" disabled={bezig} className="rounded-full bg-antraciet px-5 py-2.5 text-sm text-kastwit disabled:opacity-60">
        {bezig ? "Bezig…" : "Uitnodigen"}
      </button>
      {staat.fase !== "leeg" && (
        <p role="status" className={`text-sm sm:col-span-3 ${staat.fase === "fout" ? "text-blusrood-op-licht" : "text-[#2c6b4d]"}`}>
          {staat.melding}
        </p>
      )}
    </form>
  );
}
