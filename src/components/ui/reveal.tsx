"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Scroll-reveal: fade-up on first intersection, 350 ms, honours
 * prefers-reduced-motion (content simply appears). CSS-only transition —
 * no animation library on marketing routes.
 *
 * The markup renders *visible*. Shipping `opacity: 0` from the server means
 * the text only appears once JS has downloaded, hydrated and the observer has
 * fired — on a throttled connection that measured as a 3.6 s LCP on
 * /hoe-het-werkt, and it leaves the page blank entirely if the bundle never
 * arrives. So the animation is opt-in, applied on mount and only to elements
 * that are still below the fold, where nobody can see them being hidden.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  /** Stagger offset in ms */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Already on screen (or above it): leave it alone. Hiding it now would
    // make it flicker, and it costs the LCP nothing to stay painted.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.style.transition = "none";
    el.style.opacity = "0";
    el.style.transform = "translateY(16px)";

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.style.transition = `opacity 350ms ease-out ${delay}ms, transform 350ms ease-out ${delay}ms`;
        el.style.opacity = "1";
        el.style.transform = "none";
        io.disconnect();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
