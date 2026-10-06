"use client";

import { useState } from "react";
import {
  STAFFEL_PER_AANTAL,
  staffelPercentage,
  staffelStukprijs,
} from "@/lib/catalogus";
import { euro, PRIJS_INCL_CENTEN } from "@/lib/pricing";
import { koopNu } from "@/app/winkelwagen/acties";

/**
 * Aantal kiezen, met de staffelkorting live erbij.
 *
 * Twee redenen om hier een knopje-plus-knopje van te maken in plaats van een
 * kaal <input type=number>: de pijltjes van de browser zijn op een telefoon
 * nauwelijks te raken, en het aantal is precies de plek waar de staffel
 * uitgelegd hoort te worden. Wie 30 stuks intikt hoort meteen te zien dat de
 * prijs zakt — dat stond tot nu toe alleen op /zakelijk.
 *
 * Het invoerveld blijft bestaan en houdt zijn naam, zodat de server action
 * ongewijzigd blijft werken en de pagina het ook zonder JavaScript doet.
 */

const MAX = 300;

export function AantalKiezer() {
  const [aantal, setAantal] = useState(1);

  const korting = staffelPercentage(aantal);
  const stuk = staffelStukprijs(aantal, PRIJS_INCL_CENTEN);
  const totaal = stuk * aantal;
  const totVolgende = STAFFEL_PER_AANTAL - (aantal % STAFFEL_PER_AANTAL);

  const klem = (n: number) => Math.min(MAX, Math.max(1, n));
  const stel = (n: number) => setAantal(klem(n));
  // Functievorm, en niet setAantal(aantal + 1): React verwerkt state gebundeld,
  // dus meerdere kliks vlak na elkaar rekenen anders allemaal met dezelfde
  // oude waarde en blijft de teller achter bij wat je aanklikt.
  const stap = (d: number) => setAantal((v) => klem(v + d));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-stretch rounded-full border border-kastwit/25">
          <button
            type="button"
            onClick={() => stap(-1)}
            disabled={aantal <= 1}
            aria-label="Eén minder"
            className="rounded-full px-4 text-lg text-kastwit/80 transition-colors hover:bg-kastwit/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            −
          </button>
          <label htmlFor="aantal" className="sr-only">
            Aantal
          </label>
          <input
            id="aantal"
            name="aantal"
            type="number"
            min={1}
            max={MAX}
            value={aantal}
            onChange={(e) => stel(Number(e.target.value) || 1)}
            className="data w-16 border-x border-kastwit/25 bg-transparent py-3.5 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => stap(1)}
            disabled={aantal >= MAX}
            aria-label="Eén meer"
            className="rounded-full px-4 text-lg text-kastwit/80 transition-colors hover:bg-kastwit/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            +
          </button>
        </div>

        {/* Het totaal naast het aantal: dat is wat de klant straks
            betaalt, en daar hoort hij niet voor te hoeven rekenen. */}
        <p className="data ml-auto text-right text-sm text-kastwit/80" aria-live="polite">
          <span className="block text-[11px] uppercase tracking-widest text-kastwit/50">Totaal</span>
          <span className="text-lg text-kastwit">{euro(totaal)}</span>
        </p>
      </div>

      {/*
        Twee knoppen. "Koop nu" gaat in één keer naar het afrekenen;
        "In winkelwagen" is er voor wie nog wil rondkijken. Alleen een
        koopknop jaagt twijfelaars weg, alleen een winkelwagenknop maakt de
        route voor iedereen langer.
      */}
      <div className="mt-4 grid gap-2.5 sm:grid-cols-[1.4fr_1fr]">
        <button
          type="submit"
          formAction={koopNu}
          className="group flex items-center justify-center gap-2 rounded-full bg-blusrood-vlak px-8 py-4 text-base font-semibold text-kastwit shadow-[0_8px_24px_-8px_rgba(210,35,31,0.7)] transition-all hover:-translate-y-px hover:bg-[#9e1b18] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          Koop nu
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
        <button
          type="submit"
          className="rounded-full border border-kastwit/35 px-6 py-4 text-sm font-medium text-kastwit transition-colors hover:bg-kastwit hover:text-antraciet"
        >
          In winkelwagen
        </button>
      </div>

      {korting > 0 && (
        <p className="data mt-3 text-sm text-kastwit/80">
          {aantal} × {euro(stuk)}{" "}
          <span className="text-blusrood-op-donker">
            −{korting.toString().replace(".", ",")}% staffelkorting
          </span>
        </p>
      )}

      {korting < 17.5 && aantal >= 10 && (
        <p className="mt-1 text-xs text-kastwit/50">
          Nog {totVolgende} stuks tot{" "}
          {staffelPercentage(aantal + totVolgende)
            .toString()
            .replace(".", ",")}
          % korting.
        </p>
      )}
    </div>
  );
}
