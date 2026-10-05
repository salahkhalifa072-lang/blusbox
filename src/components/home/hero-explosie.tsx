"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Variant A: de module als explosietekening.
 *
 * Een explosietekening is een technisch genre met een eigen taal —
 * verwijslijnen die onderdelen benoemen. Daar zit het verschil tussen een
 * product dat zweeft en een product dat iets uitlegt. De verwijzingen
 * verschijnen alleen op het moment dat de module uit elkaar ligt
 * (frames 61–112 van 158, bij 24 fps) en verdwijnen als hij dichtklikt.
 *
 * Transparante video vraagt twee bestanden. Safari en elke browser op een
 * iPhone (allemaal WebKit) spelen alleen HEVC met alfakanaal; Chrome,
 * Firefox en Android alleen VP9-WebM met alfakanaal. Volgorde van
 * <source>-elementen is hier geen oplossing: Chrome op een Mac zegt HEVC
 * te kunnen afspelen en toont het dan met een zwarte achtergrond. Daarom
 * wordt de bron gekozen op de browsermotor.
 *
 * Bij "minder beweging" staat de film stil op het uiteengevallen moment,
 * met de verwijzingen zichtbaar: dan is het een gewone technische tekening.
 */

const OPEN_VAN = 61 / 24;
const OPEN_TOT = 112 / 24;
const STILSTAND = 88 / 24;

/** Posities in procenten van het videovak (720 × 738), gemeten op frame 90. */
const VERWIJZINGEN = [
  {
    // deeltjeswolk boven de kern
    anker: { x: 46, y: 14 },
    label: { x: 4, y: 7 },
    kant: "links" as const,
    kop: "Condensed aerosol",
    regel: "Niet-geleidend residu",
  },
  {
    // blauw koord tussen kern en rechterhelft
    anker: { x: 74, y: 51 },
    label: { x: 97, y: 84 },
    kant: "rechts" as const,
    kop: "Detectiekoord",
    regel: "Grijpt in bij",
    temperatuur: true,
  },
  {
    // linker behuizingshelft
    anker: { x: 9, y: 70 },
    label: { x: 3, y: 92 },
    kant: "links" as const,
    kop: "Behuizing",
    regel: "Klikt op de DIN-rail",
  },
];

function isWebKit(): boolean {
  if (typeof navigator === "undefined") return false;
  // Alle browsers op iOS en Safari op de Mac melden Apple als leverancier.
  return navigator.vendor?.includes("Apple") ?? false;
}

export function HeroExplosie() {
  const video = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v) return;

    const stil = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    v.src = isWebKit() ? "/media/hero/explosie-hevc.mov" : "/media/hero/explosie.webm";

    if (stil) {
      const zetStil = () => {
        v.currentTime = STILSTAND;
        setOpen(true);
      };
      v.addEventListener("loadedmetadata", zetStil, { once: true });
      v.load();
      return () => v.removeEventListener("loadedmetadata", zetStil);
    }

    v.load();
    v.play().catch(() => {
      /* autoplay geweigerd: de poster blijft staan, niets aan de hand */
    });

    // Per frame meekijken waar de film is. Alleen bij een omslag wordt
    // er een render aangevraagd, dus dit kost niets.
    let laatst = false;
    let id = 0;
    const kijk = () => {
      const t = v.currentTime;
      const nu = t >= OPEN_VAN && t <= OPEN_TOT;
      if (nu !== laatst) {
        laatst = nu;
        setOpen(nu);
      }
      id = requestAnimationFrame(kijk);
    };
    id = requestAnimationFrame(kijk);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="relative mx-auto aspect-[720/738] w-full max-w-[44rem]">
      {/* Gloed achter de kern: warmte die binnen blijft. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[12%] rounded-full bg-[radial-gradient(closest-side,rgba(210,35,31,0.32),rgba(210,35,31,0.08)_55%,transparent)] blur-2xl"
      />

      <video
        ref={video}
        muted
        loop
        playsInline
        preload="auto"
        poster="/media/hero/explosie-poster.webp"
        aria-label="De Blusbox-module valt uiteen in behuizing, aerosolkern en detectiekoord, en klikt weer dicht"
        // De bronanimatie snijdt de buitenste onderdelen af aan de rand.
        // Een zachte overloop aan beide kanten verbergt die harde snede.
        className="relative h-full w-full [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]"
      />

      <div aria-hidden className="pointer-events-none absolute inset-0">
        {VERWIJZINGEN.map((v) => (
          <Verwijzing key={v.kop} {...v} zichtbaar={open} />
        ))}
      </div>
    </div>
  );
}

function Verwijzing({
  anker,
  label,
  kant,
  kop,
  regel,
  temperatuur,
  zichtbaar,
}: (typeof VERWIJZINGEN)[number] & { zichtbaar: boolean }) {
  return (
    <>
      {/* Verbindingslijn van ankerpunt naar label, in een SVG over het
          hele vak zodat hij met het vak meeschaalt. */}
      <svg
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 motion-reduce:transition-none ${zichtbaar ? "opacity-100" : "opacity-0"}`}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line
          x1={anker.x}
          y1={anker.y}
          x2={label.x + (kant === "rechts" ? 0 : 0)}
          y2={label.y}
          stroke="rgba(232,233,230,0.45)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <span
        className={`absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-kastwit ring-4 ring-kastwit/15 transition-all duration-500 motion-reduce:transition-none ${zichtbaar ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
        style={{ left: `${anker.x}%`, top: `${anker.y}%` }}
      />

      <span
        className={`absolute -translate-y-1/2 whitespace-nowrap transition-all duration-500 motion-reduce:transition-none ${kant === "rechts" ? "-translate-x-full text-right" : ""} ${zichtbaar ? "opacity-100" : "translate-y-[-30%] opacity-0"}`}
        style={{ left: `${label.x}%`, top: `${label.y}%` }}
      >
        {/* Een donker plaatje achter de tekst: de labels vallen over de
            witte aerosoldeeltjes en zijn anders op een telefoon niet te lezen. */}
        <span className="inline-block rounded-md bg-antraciet/75 px-2 py-1 ring-1 ring-kastwit/10 backdrop-blur-sm">
        <span className="data block text-[10px] uppercase tracking-[0.14em] text-kastwit sm:text-[11px]">
          {kop}
        </span>
        <span className="block text-[11px] text-kastwit/70 sm:text-xs">
          {regel}
          {temperatuur && <span className="data text-signaal"> 170 °C</span>}
        </span>
        </span>
      </span>
    </>
  );
}
