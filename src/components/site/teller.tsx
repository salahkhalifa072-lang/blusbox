"use client";

import { useEffect, useRef } from "react";

/**
 * Een getal dat optelt zodra het in beeld komt.
 *
 * De server levert het eindgetal, zodat het er ook staat zonder
 * JavaScript, voor zoekmachines en bij "minder beweging". Schermlezers
 * krijgen via aria-label altijd het eindgetal, niet de tussenstanden.
 */
export function Teller({
  tot,
  duurMs = 900,
  wachtMs = 0,
  className,
}: {
  tot: number;
  duurMs?: number;
  wachtMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        let start: number | null = null;
        el.textContent = "0";
        const stap = (nu: number) => {
          if (start === null) start = nu;
          const p = Math.min(Math.max((nu - start - wachtMs) / duurMs, 0), 1);
          // Uitlopen: snel beginnen, rustig aankomen.
          el.textContent = String(Math.round(tot * (1 - Math.pow(1 - p, 3))));
          if (p < 1) frame = requestAnimationFrame(stap);
        };
        frame = requestAnimationFrame(stap);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = String(tot);
    };
  }, [tot, duurMs, wachtMs]);

  return (
    <span ref={ref} className={className} aria-label={String(tot)}>
      {tot}
    </span>
  );
}
