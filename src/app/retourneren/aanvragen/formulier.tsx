"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { meldRetourAan, type RetourStaat } from "./acties";

function Knop() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-blusrood-vlak px-7 py-3.5 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18] disabled:opacity-60"
    >
      {pending ? "Bezig…" : "Retour aanmelden"}
    </button>
  );
}

export function RetourFormulier() {
  const [staat, actie] = useActionState<RetourStaat, FormData>(meldRetourAan, {
    fase: "leeg",
  });

  if (staat.fase === "gelukt") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-railstaal/50 bg-kastwit p-8"
      >
        <h2 className="font-display text-2xl">Retour aangemeld</h2>
        <p className="mt-3 text-staal-tekst">
          We hebben je aanmelding voor bestelling{" "}
          <span className="data">{staat.ordernummer}</span> ontvangen.
        </p>

        {staat.binnenTermijn ? (
          <p className="mt-4 text-staal-tekst">
            Je zit binnen de bedenktijd van veertien dagen — die liep tot en met{" "}
            <span className="data">{staat.uiterlijk}</span>. Je hoeft geen reden
            op te geven en je krijgt het volledige bedrag terug, inclusief de
            standaard verzendkosten.
          </p>
        ) : (
          <p className="mt-4 text-staal-tekst">
            De bedenktijd van veertien dagen is verstreken op{" "}
            <span className="data">{staat.uiterlijk}</span>. We kijken je
            aanvraag na op grond van je wettelijke rechten bij een product dat
            niet aan de overeenkomst beantwoordt, en nemen contact met je op.
          </p>
        )}

        <div className="mt-6 rounded-xl border border-signaal bg-signaal/15 p-4">
          <p className="text-sm font-medium">Stuur de module nog niet terug</p>
          <p className="mt-1 text-sm">
            Meld je retour hier aan, dan ontvang je het retouradres en de
            instructies. Zo weten wij welk pakket eraan komt en kunnen we je
            geld sneller terugstorten.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/herroepingsrecht"
            className="data text-sm underline underline-offset-4"
          >
            Over het herroepingsrecht
          </Link>
          <Link
            href="/contact"
            className="data text-sm underline underline-offset-4"
          >
            Contact opnemen
          </Link>
        </div>
      </div>
    );
  }

  const velden = staat.fase === "fout" ? (staat.velden ?? {}) : {};

  return (
    <form action={actie} className="space-y-5">
      {staat.fase === "fout" && !staat.velden ? (
        <div
          role="alert"
          className="rounded-2xl border border-signaal bg-signaal/15 p-4"
        >
          <p className="text-sm font-medium">{staat.melding}</p>
          {staat.oplossing ? (
            <p className="mt-1 text-sm">{staat.oplossing}</p>
          ) : null}
        </div>
      ) : null}

      <div>
        <label htmlFor="ordernummer" className="block text-sm font-medium">
          Bestelnummer
        </label>
        <input
          id="ordernummer"
          name="ordernummer"
          required
          placeholder="BB-2026-000123"
          aria-invalid={velden.ordernummer ? true : undefined}
          aria-describedby={velden.ordernummer ? "ordernummer-fout" : undefined}
          className={`data mt-1.5 w-full rounded-[var(--radius-control)] border bg-kastwit px-4 py-3 text-sm ${
            velden.ordernummer ? "border-blusrood-op-licht" : "border-railstaal"
          }`}
        />
        {velden.ordernummer ? (
          <p id="ordernummer-fout" className="mt-1 text-sm text-blusrood-op-licht">
            {velden.ordernummer}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          E-mailadres van de bestelling
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={velden.email ? true : undefined}
          aria-describedby={velden.email ? "email-fout" : undefined}
          className={`mt-1.5 w-full rounded-[var(--radius-control)] border bg-kastwit px-4 py-3 text-sm ${
            velden.email ? "border-blusrood-op-licht" : "border-railstaal"
          }`}
        />
        {velden.email ? (
          <p id="email-fout" className="mt-1 text-sm text-blusrood-op-licht">
            {velden.email}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="reden" className="block text-sm font-medium">
          Reden (optioneel)
        </label>
        <textarea
          id="reden"
          name="reden"
          rows={4}
          className="mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-4 py-3 text-sm"
        />
        <p className="mt-1.5 text-xs text-staal-tekst">
          Binnen de bedenktijd hoef je geen reden op te geven. Het helpt ons wel
          het product te verbeteren.
        </p>
      </div>

      <Knop />
    </form>
  );
}
