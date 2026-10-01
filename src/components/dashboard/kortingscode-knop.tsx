"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { wisselActief, type CodeStaat } from "@/app/dashboard/kortingscodes/acties";

/**
 * Aan- en uitzetten van één code.
 *
 * Uitzetten vraagt een bevestiging, aanzetten niet. De richting die geld
 * kost is aanzetten, maar de richting die een lopende actie midden op de
 * dag onderbreekt is uitzetten — en dat is degene waar je per ongeluk op
 * klikt terwijl je de tabel doorleest.
 */
function Knop({ actief, code }: { actief: boolean; code: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (
          actief &&
          !window.confirm(
            `${code.toUpperCase()} uitzetten? Nieuwe bestellingen krijgen dan geen korting meer.`,
          )
        ) {
          e.preventDefault();
        }
      }}
      className={
        actief
          ? "data rounded-full border border-antraciet px-3 py-1.5 text-xs transition-colors hover:bg-antraciet hover:text-kastwit disabled:opacity-60"
          : "data rounded-full bg-antraciet px-4 py-1.5 text-xs text-kastwit transition-opacity hover:opacity-85 disabled:opacity-60"
      }
    >
      {pending ? "Bezig…" : actief ? "Uitzetten" : "Aanzetten"}
    </button>
  );
}

export function ActiefKnop({ code, actief }: { code: string; actief: boolean }) {
  const [staat, actie] = useActionState<CodeStaat, FormData>(wisselActief, {
    fase: "leeg",
  });

  return (
    <div>
      <form action={actie}>
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="naar" value={actief ? "uit" : "aan"} />
        <Knop actief={actief} code={code} />
      </form>
      {staat.fase !== "leeg" && (
        <p
          role="status"
          className={`mt-1.5 max-w-[22rem] text-xs ${
            staat.fase === "fout" ? "text-blusrood-op-licht" : "text-staal-tekst"
          }`}
        >
          {staat.melding}
        </p>
      )}
    </div>
  );
}
