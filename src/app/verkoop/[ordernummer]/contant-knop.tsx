"use client";

import { useFormStatus } from "react-dom";

/** "Toch contant", met bevestiging: daarna is de factuur voldaan en verstuurd. */
export function ContantKnop({ totaal }: { totaal: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(`Heb je ${totaal} contant ontvangen van de klant?`)) e.preventDefault();
      }}
      className="w-full rounded-full border-2 border-antraciet bg-kastwit px-5 py-3.5 text-sm font-semibold disabled:opacity-60"
    >
      {pending ? "Afronden…" : `Klant betaalt contant · ${totaal}`}
    </button>
  );
}
