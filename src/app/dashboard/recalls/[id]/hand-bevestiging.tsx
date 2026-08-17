"use client";

import { useFormStatus } from "react-dom";
import { bevestigMetDeHand } from "../acties";

function Knop({ email }: { email: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="data rounded-full border border-antraciet px-3 py-1 text-xs transition-colors hover:bg-antraciet hover:text-kastwit disabled:opacity-60"
    >
      {pending ? "Bezig…" : "Bevestigd"}
      {/* Zonder dit heet elke knop in de tabel hetzelfde. */}
      <span className="sr-only"> voor {email}</span>
    </button>
  );
}

/**
 * Afvinken van een afnemer die niet via de mail heeft gereageerd.
 *
 * Registreert het moment van nú, niet het moment van het telefoontje: dat
 * laatste weten we niet en verzinnen we niet. Wie de precieze datum wil
 * vastleggen, noteert die in het klantdossier.
 */
export function HandBevestiging({
  noticeId,
  email,
}: {
  noticeId: string;
  email: string;
}) {
  return (
    <form action={bevestigMetDeHand}>
      <input type="hidden" name="noticeId" value={noticeId} />
      <Knop email={email} />
    </form>
  );
}
