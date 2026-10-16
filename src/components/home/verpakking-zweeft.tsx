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
  // Draait van voor via de BLUSBOX-zijkant naar achter en terug. Een volle
  // 360° uit twee AI-clips gaf een zichtbare sprong waar ze aansloten;
  // heen-en-terug van één clip loopt naadloos en toont alleen echt drukwerk.
  draait: {
    naam: "verpakking-draait",
    label: "De rode Blusbox-verpakking draait van de voorkant via de zijkant naar de achterkant met uitleg en technische gegevens, en weer terug",
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
