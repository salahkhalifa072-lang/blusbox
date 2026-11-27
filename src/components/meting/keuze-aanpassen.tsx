"use client";

import { useEffect, useState } from "react";
import { abonneer, leesKeuze, openCookieInstellingen, type Keuze } from "@/lib/toestemming";

/**
 * Je keuze terugzien en intrekken, op de cookiepagina.
 *
 * Toestemming intrekken moet even makkelijk zijn als geven. Een vraag die
 * één keer verschijnt en daarna nooit meer, voldoet daar niet aan: wie op
 * "Akkoord" drukte zit er dan aan vast. Deze knop opent dezelfde vraag
 * opnieuw, net als "Cookie-instellingen" in de footer.
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
        onClick={openCookieInstellingen}
        className="underline underline-offset-4 hover:text-staal-tekst"
      >
        Keuze wijzigen
      </button>{" "}
      — je krijgt dan weer de keuze tussen Weigeren en Akkoord; dit kan ook
      via &ldquo;Cookie-instellingen&rdquo; onderaan elke pagina. Kies je
      Weigeren, dan laden de scripts van Google en Meta niet meer. Cookies
      die al geplaatst zijn verwijder je via de instellingen van je browser.
    </p>
  );
}
