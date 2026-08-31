"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Cart count in the header.
 *
 * Deliberately a client component: reading the cart cookie on the server
 * would opt every marketing page out of static rendering, and those pages
 * carry the LCP budget. The count arrives just after paint instead, which
 * is the right trade for a number almost always showing zero on a first
 * visit.
 */
export function WagenBadge() {
  const [aantal, setAantal] = useState<number | null>(null);
  const pad = usePathname();

  useEffect(() => {
    let afgebroken = false;
    fetch("/api/wagen", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { aantal: 0 }))
      .then((d) => {
        if (!afgebroken) setAantal(Number(d.aantal) || 0);
      })
      .catch(() => {
        if (!afgebroken) setAantal(0);
      });
    return () => {
      afgebroken = true;
    };
    // refetch after navigation, so adding to cart updates the header
  }, [pad]);

  const n = aantal ?? 0;

  return (
    // aria-label in plaats van een sr-only regel ernaast: anders leest een
    // schermlezer eerst het zichtbare label en dan nóg een keer hetzelfde.
    <Link
      href="/winkelwagen"
      aria-label={`Winkelwagen, ${n} ${n === 1 ? "artikel" : "artikelen"}`}
      className="data whitespace-nowrap text-xs text-kastwit/60 transition-colors hover:text-kastwit"
    >
      {/* Op een telefoon staan logo, menuknop en bestelknop al in dezelfde
          balk; daar past geen woord meer bij. Icoon met het aantal dus, en
          voluit zodra er ruimte is. */}
      <span className="flex items-center gap-1 sm:hidden">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="square"
          aria-hidden
        >
          <path d="M4 7h16l-1.5 10H5.5L4 7Z" />
          <path d="M9 7V5a3 3 0 0 1 6 0v2" />
        </svg>
        {n}
      </span>
      <span className="hidden sm:inline">Winkelwagen ({n})</span>
    </Link>
  );
}
