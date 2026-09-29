"use client";

import { useEffect, useState } from "react";
import { abonneer, leesKeuze, wisKeuze, type Keuze } from "@/lib/toestemming";

/**
 * Je keuze terugzien en intrekken, op de cookiepagina.
 *
 * Toestemming intrekken moet even makkelijk zijn als geven. Een banner die
 * één keer verschijnt en daarna nooit meer, voldoet daar niet aan: wie op
 * "Akkoord" drukte zit er dan aan vast. Deze knop wist de keuze, waarna de
 * banner opnieuw verschijnt.
 *
 * Wat er al geplaatst is verdwijnt hiermee niet uit de browser. Dat wordt
 * er dus ook niet beloofd — er staat bij hoe je die cookies zelf opruimt.
 */
export function KeuzeAanpassen() {
  const [keuze, setKeuze] = useState<Keuze | null | undefined>(undefined);

  useEffect(() => {
    setKeuze(leesKeuze());
    return abonneer(setKeuze);
  }, []);

  // Op de server en bij de eerste weergave weten we de keuze nog niet.
  if (keuze === undefined) {
    return <p className="text-staal-tekst">Je keuze wordt opgehaald…</p>;
  }

  if (keuze === null) {
    return (
      <p>
        Je hebt nog geen keuze gemaakt. Onderaan het scherm staat de vraag; tot
        je die beantwoordt wordt er niets gemeten.
      </p>
    );
  }

  return (
    <p>
      Je hebt{" "}
      <strong>
        {keuze === "verleend" ? "toestemming gegeven" : "geweigerd"}
      </strong>
      .{" "}
      <button
        type="button"
        onClick={wisKeuze}
        className="underline underline-offset-4 hover:text-staal-tekst"
      >
        Keuze intrekken
      </button>{" "}
      — daarna verschijnt de vraag opnieuw. Cookies die al geplaatst zijn
      verwijder je via de instellingen van je browser.
    </p>
  );
}
