"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Zet `data-anim` op zijn element zodra het in beeld komt, zodat CSS de
 * animatie kan starten (zie `.getest` in globals.css).
 *
 * Zelfde uitgangspunt als Reveal: de server levert alles zichtbaar en in
 * de eindstand. Pas in de browser, en alleen als het blok nog onder de
 * vouw staat, wordt de inhoud verborgen om hem te laten binnenkomen.
 * Staat het blok al in beeld, dan bewegen alleen de versieringen (ring en
 * vinkje); tekst die er al staat laten we niet eerst verdwijnen. Bij
 * "minder beweging" gebeurt er niets.
 */
export function InBeeld({
  children,
  className = "",
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
      el.dataset.anim = "sier";
      return;
    }

    el.dataset.anim = "wacht";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.anim = "speel";
        io.disconnect();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className} {...rest}>
      {children}
    </Tag>
  );
}
