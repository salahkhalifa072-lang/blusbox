"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Laat de balk met logo en menu wegschuiven bij naar beneden scrollen en
 * terugkomen bij naar boven scrollen. De verzendbalk erboven blijft staan.
 *
 * Wie naar beneden scrolt is aan het lezen; dan kost de balk alleen ruimte,
 * op een telefoon bijna een tiende van het scherm. Wie terug omhoog scrolt
 * zoekt meestal het menu of de winkelwagen, en krijgt die meteen terug.
 *
 * - Bovenaan de pagina staat hij altijd.
 * - Kleine bewegingen tellen niet: pas na 8 px dezelfde kant op wisselt
 *   hij, anders flikkert hij bij elk trillend duimpje.
 * - Staat het mobiele menu open, dan blijft hij staan.
 * - Weggeschoven is hij `inert`: niet aan te tikken en niet bereikbaar met
 *   Tab, zodat er geen onzichtbare knoppen in de weg zitten.
 */
export function KopBijScrollen({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [weg, setWeg] = useState(false);

  useEffect(() => {
    let vorige = window.scrollY;
    let gepland = false;

    const bekijk = () => {
      gepland = false;
      const y = window.scrollY;
      const verschil = y - vorige;
      if (y < 80) {
        setWeg(false);
        vorige = y;
        return;
      }
      if (Math.abs(verschil) < 8) return;
      vorige = y;
      if (verschil > 0) {
        if (!ref.current?.querySelector('[aria-expanded="true"]')) setWeg(true);
      } else {
        setWeg(false);
      }
    };

    const opScroll = () => {
      if (gepland) return;
      gepland = true;
      requestAnimationFrame(bekijk);
    };

    window.addEventListener("scroll", opScroll, { passive: true });
    return () => window.removeEventListener("scroll", opScroll);
  }, []);

  return (
    <div
      ref={ref}
      inert={weg}
      data-weg={weg ? "" : undefined}
      className={`transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
        weg ? "-translate-y-[calc(100%+1rem)] opacity-0" : ""
      }`}
    >
      {children}
    </div>
  );
}
