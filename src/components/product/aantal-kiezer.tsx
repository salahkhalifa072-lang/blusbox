"use client";

import { useState } from "react";
import {
  STAFFEL_PER_AANTAL,
  staffelPercentage,
  staffelStukprijs,
} from "@/lib/catalogus";
import { euro, PRIJS_INCL_CENTEN } from "@/lib/pricing";

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

        <button
          type="submit"
          className="rounded-full bg-blusrood-vlak px-8 py-3.5 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
        >
          In winkelwagen
        </button>
      </div>

      {/* aria-live: de prijs verandert zonder paginawissel, dus het moet
          voorgelezen worden. Polite, want het mag niets onderbreken. */}
      <p className="data mt-3 text-sm text-kastwit/80" aria-live="polite">
        {korting > 0 ? (
          <>
            {aantal} × {euro(stuk)} = <span className="text-kastwit">{euro(totaal)}</span>{" "}
            <span className="text-blusrood-op-donker">
              −{korting.toString().replace(".", ",")}% staffelkorting
            </span>
          </>
        ) : (
          <>
            {aantal} × {euro(PRIJS_INCL_CENTEN)} ={" "}
            <span className="text-kastwit">{euro(totaal)}</span>
          </>
        )}
      </p>

      {korting < 17.5 && (
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
