"use client";

import { useState } from "react";
import Image from "next/image";
import { VideoBlock } from "@/components/ui/video-block";
import { LogoBadge } from "@/components/site/logo";

/**
 * Productgalerij: één groot beeld met een keuzerail eronder.
 *
 * Vervangt de verticale stapel waarin alle vier de beelden onder elkaar
 * stonden. Die stapel duwde het koopblok op mobiel ver naar beneden en gaf
 * elk beeld evenveel gewicht, terwijl de packshot het beeld is dat verkoopt.
 *
 * De keuzerail bestaat uit echte <button>-elementen en niet uit divs met een
 * klik-handler: zo werkt tabben en Enter vanzelf, inclusief focusrand, en
 * hoort een schermlezer dat het bedienbaar is.
 *
 * Alle beelden blijven in de DOM staan en worden met `hidden` verborgen in
 * plaats van uitgewisseld. Daardoor is een tweede keer kijken direct, en
 * blijft de video zijn positie houden als je terugschakelt.
 */

type Beeld =
  | { soort: "foto"; src: string; alt: string; label: string }
  | {
      soort: "video";
      src: string;
      poster: string;
      alt: string;
      label: string;
      /** Echte opname, geen weergave. Bepaalt het bijschrift onderaan. */
      echt?: boolean;
    };

const BEELDEN: Beeld[] = [
  {
    soort: "foto",
    src: "/media/packshot.jpg",
    alt: "Blusbox-module: matrode behuizing met DIN-railclip en detectiekoord",
    label: "Module",
  },
  {
    soort: "video",
    src: "/media/plaatsing-meterkast.mp4",
    poster: "/media/plaatsing-meterkast.jpg",
    alt: "Opname van een test: de module wordt op de DIN-rail geklikt, in de kast ontstaat brand, de module gaat af en dooft het vuur",
    label: "Plaatsing",
    echt: true,
  },
  {
    soort: "video",
    src: "/media/meterkast-front.mp4",
    poster: "/media/meterkast-front.jpg",
    alt: "Fragment: een beginnende brand in de meterkast wordt door de Blusbox-module met aerosol gedoofd",
    label: "In de kast",
  },
  {
    soort: "foto",
    src: "/media/verpakking-dicht.jpg",
    alt: "Gesloten rode Blusbox-verpakking met logo en de tekst blusmodule voor de meterkast",
    label: "Verpakking",
  },
  {
    soort: "foto",
    src: "/media/verpakking-open.jpg",
    alt: "Geopende Blusbox-verpakking: de module met vastzittend lichtblauw detectiekoord, naast een rode kaart met het Blusbox-logo",
    label: "Inhoud",
  },
];

export function Galerij() {
  const [actief, setActief] = useState(0);

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-antraciet-verhoogd">
        {BEELDEN.map((b, i) => (
          <div
            key={b.src}
            hidden={i !== actief}
            className="absolute inset-0"
            aria-hidden={i !== actief}
          >
            {b.soort === "foto" ? (
              <Image
                src={b.src}
                alt={b.alt}
                fill
                // alleen het eerste beeld telt voor de LCP; de rest mag wachten
                priority={i === 0}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <VideoBlock
                src={b.src}
                poster={b.poster}
                label={b.alt}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </div>
        ))}
        <LogoBadge />
      </div>

      <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {BEELDEN.map((b, i) => {
          const gekozen = i === actief;
          return (
            <li key={b.src}>
              <button
                type="button"
                onClick={() => setActief(i)}
                aria-pressed={gekozen}
                className={`group relative block w-full overflow-hidden rounded-xl border transition-colors ${
                  gekozen
                    ? "border-kastwit"
                    : "border-kastwit/20 hover:border-kastwit/50"
                }`}
              >
                <span className="relative block aspect-square overflow-hidden bg-antraciet-verhoogd">
                  <Image
                    src={b.soort === "foto" ? b.src : b.poster}
                    alt=""
                    fill
                    sizes="120px"
                    className={`object-cover transition-opacity ${
                      gekozen ? "opacity-100" : "opacity-60 group-hover:opacity-90"
                    }`}
                  />
                </span>
                <span className="data block px-1 py-1.5 text-center text-[10px] text-kastwit/70">
                  {b.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="data mt-3 text-xs text-railstaal">
        {BEELDEN[actief].soort === "video" && BEELDEN[actief].echt
          ? "Opname van een test."
          : "Beeld is een weergave."}
      </p>
    </div>
  );
}
