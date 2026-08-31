"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

/**
 * Navigatie voor smalle schermen.
 *
 * De pill-header toont zijn links pas vanaf lg. Daaronder was er geen enkele
 * weg naar de andere pagina's: alleen het logo en de bestelknop. Wie op een
 * telefoon binnenkwam via een zoekresultaat zat vast op die ene pagina.
 *
 * Bewust een paneel dat opent en geen apart scherm: één laag, en de knop
 * blijft op dezelfde plek staan zodat sluiten net zo makkelijk is als openen.
 */
export function MobielMenu({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const paneelId = useId();
  const knopRef = useRef<HTMLButtonElement>(null);
  const pad = usePathname();

  // Bij een paginawissel hoort het menu dicht te zijn; anders blijft het
  // open staan over de nieuwe pagina heen.
  useEffect(() => {
    setOpen(false);
  }, [pad]);

  // Escape sluit, en de focus gaat terug naar de knop — anders staat de
  // focus in het niets zodra het paneel verdwijnt.
  useEffect(() => {
    if (!open) return;
    const opToets = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        knopRef.current?.focus();
      }
    };
    window.addEventListener("keydown", opToets);
    return () => window.removeEventListener("keydown", opToets);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={knopRef}
        type="button"
        aria-expanded={open}
        aria-controls={paneelId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-kastwit transition-colors hover:bg-kastwit/10"
      >
        <span className="sr-only">{open ? "Menu sluiten" : "Menu openen"}</span>
        {/* Twee vormen in één svg, zodat de knop niet van grootte verspringt */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          aria-hidden
        >
          {open ? (
            <>
              <path d="M5 5l14 14" />
              <path d="M19 5L5 19" />
            </>
          ) : (
            <>
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </>
          )}
        </svg>
      </button>

      {open ? (
        <nav
          id={paneelId}
          aria-label="Hoofdnavigatie"
          // Dekkend, niet doorschijnend: hierachter loopt de herofilm, en
          // een bewegend product achter de menutekst leest slecht.
          className="absolute inset-x-4 top-full mt-2 rounded-2xl border border-kastwit/15 bg-antraciet p-2 shadow-2xl shadow-black/50 sm:inset-x-6"
        >
          <ul>
            {items.map((item) => {
              const huidig = pad === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={huidig ? "page" : undefined}
                    className={`block rounded-xl px-4 py-3 text-base transition-colors ${
                      huidig
                        ? "bg-kastwit/10 text-kastwit"
                        : "text-kastwit/75 hover:bg-kastwit/10 hover:text-kastwit"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-1 border-t border-kastwit/10 pt-1">
              <Link
                href="/contact"
                className="block rounded-xl px-4 py-3 text-base text-kastwit/75 transition-colors hover:bg-kastwit/10 hover:text-kastwit"
              >
                Contact
              </Link>
            </li>
            <li>
              <Link
                href="/account"
                className="block rounded-xl px-4 py-3 text-base text-kastwit/75 transition-colors hover:bg-kastwit/10 hover:text-kastwit"
              >
                Inloggen
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
