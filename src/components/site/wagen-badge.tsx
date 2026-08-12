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
      {/* Kort op een telefoon, voluit zodra er ruimte is */}
      <span className="sm:hidden">Wagen ({n})</span>
      <span className="hidden sm:inline">Winkelwagen ({n})</span>
    </Link>
  );
}
