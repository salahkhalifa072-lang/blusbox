"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Scroll-reveal: fade-up on first intersection, 350 ms, honours
 * prefers-reduced-motion (content simply appears). CSS-only transition —
 * no animation library on marketing routes.
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "none";
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(16px)",
        transition: `opacity 350ms ease-out ${delay}ms, transform 350ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
