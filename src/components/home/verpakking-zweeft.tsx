"use client";

import { useEffect, useRef } from "react";

/**
 * De verpakking die zachtjes zweeft, zonder achtergrond.
 *
 * Gemaakt met Kling 2.5 (Higgsfield) vanaf de mockup op green screen, met
 * het groen er daarna uitgefilterd. Alleen de dichte doos beweegt; de
 * eerste poging liet de doos openklappen en een gewone blusser tonen, en
 * dat is niet ons product.
 *
 * Transparante video vraagt twee bestanden, net als de hero: WebKit
 * (Safari, elke iPhone-browser) speelt alleen HEVC met alfa, de rest
 * alleen VP9-WebM met alfa. De bron wordt daarom op de browsermotor
 * gekozen, niet met <source>-volgorde — Chrome op een Mac zou HEVC
 * kiezen en het met zwarte achtergrond tonen.
 *
 * Bij "minder beweging" blijft het posterbeeld staan.
 */
function isWebKit(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.vendor?.includes("Apple") ?? false;
}

const BRONNEN = {
  zweeft: {
    naam: "verpakking-zweeft",
    label: "De rode Blusbox-verpakking zweeft zachtjes: brandblusser voor in de meterkast, grijpt zelf in bij 170 °C",
  },
  // Volle 360°: twee AI-clips (voor→achter, achter→voor) achter elkaar.
  // Op de aansluiting verspringt de pose licht; de klant koos deze toch
  // boven de heen-en-terugversie. De kleine tekst op de achterkant is door
  // de AI nagetekend, daarom staat "Beeld is een weergave" eronder.
  draait: {
    naam: "verpakking-360",
    label: "De rode Blusbox-verpakking draait een volle slag rond: voorkant, zijkant, achterkant met uitleg en technische gegevens, andere zijkant",
  },
} as const;

export function VerpakkingZweeft({
  className = "",
  variant = "zweeft",
}: {
  className?: string;
  variant?: keyof typeof BRONNEN;
}) {
  const bron = BRONNEN[variant];
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Pas laden als hij in beeld komt: het blok staat halverwege de
    // homepage, en wie daar niet komt hoeft de video niet te downloaden.
    const kijker = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        kijker.disconnect();
        v.src = isWebKit()
          ? `/media/verpakking/${bron.naam}-hevc.mov`
          : `/media/verpakking/${bron.naam}.webm`;
        v.play().catch(() => {
          // Autoplay geweigerd (spaarstand): de poster blijft gewoon staan.
        });
      },
      { rootMargin: "200px" },
    );
    kijker.observe(v);
    return () => kijker.disconnect();
  }, [bron.naam]);

  return (
    <video
      ref={video}
      poster={`/media/verpakking/${bron.naam}-poster.webp`}
      muted
      loop
      playsInline
      preload="none"
      aria-label={bron.label}
      className={`h-full w-full object-contain ${className}`}
    />
  );
}
