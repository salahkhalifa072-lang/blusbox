import type { ReactNode } from "react";

/**
 * Het labeltje boven elke sectie van de homepage.
 *
 * Overal dezelfde vorm, zodat de pagina als één verhaal leest in plaats van
 * als losse blokken die elk hun eigen kopje verzonnen. Een pil met een rood
 * stipje: het rood van de module, op een plek waar het niets schreeuwt.
 */
export function SectieLabel({
  children,
  donker = false,
}: {
  children: ReactNode;
  /** Op een antracieten achtergrond. */
  donker?: boolean;
}) {
  return (
    <p
      className={`data inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-widest ${
        donker ? "border-kastwit/20 text-kastwit/70" : "border-railstaal/70 text-staal-tekst"
      }`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-blusrood" />
      {children}
    </p>
  );
}
