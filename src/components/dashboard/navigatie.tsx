"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Navigatie van het beheer.
 *
 * Op een laptop een vaste zijbalk met groepen; op een telefoon een balk
 * bovenaan met de paginatitel en onderin vier vaste knoppen. Eerst stonden
 * tien pillen in een kop die op een telefoon het hele eerste scherm vulde,
 * en nergens was te zien op welke pagina je zat.
 *
 * Client-component alleen vanwege usePathname en het menu dat open en
 * dicht moet; de items zelf komen van de server, al gefilterd op rol.
 */

export type NavItem = { href: string; label: string; groep: string; kort?: string };

function actief(pad: string, href: string): boolean {
  return href === "/dashboard" ? pad === href : pad === href || pad.startsWith(`${href}/`);
}

function Icoon({ href }: { href: string }) {
  // Eenvoudige lijniconen, één per hoofdonderdeel; de rest krijgt een stip.
  const p = {
    "/dashboard": "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z",
    "/dashboard/bestellingen": "M6 7h12l-1 13H7L6 7Zm3 0V5a3 3 0 0 1 6 0v2",
    "/dashboard/facturen": "M7 3h8l4 4v14H7V3Zm8 0v4h4M10 12h6M10 16h6",
    "/dashboard/affiliates": "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 20c0-3 2.5-5 5-5s5 2 5 5m2 0c0-2 1.5-4 4-4 1.5 0 3 1 3 3",
    "/dashboard/kortingscodes": "M4 12V4h8l8 8-8 8-8-8Zm4.5-3.5h.01",
    "/dashboard/retouren": "M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3",
    "/dashboard/lots": "M4 7h16M4 12h16M4 17h10",
    "/dashboard/units": "M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Zm0-9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
    "/dashboard/activeringen": "M13 3 5 14h6l-1 7 8-11h-6l1-7Z",
    "/dashboard/recalls": "M12 4 2.5 20h19L12 4Zm0 6v4m0 3h.01",
  }[href];
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      {p ? <path d={p} /> : <circle cx="12" cy="12" r="2.5" />}
    </svg>
  );
}

export function DashboardNavigatie({
  items,
  email,
  uitloggen,
}: {
  items: NavItem[];
  email: string;
  uitloggen: () => Promise<void>;
}) {
  const pad = usePathname();
  const [open, setOpen] = useState(false);

  // Na een klik in het menu verandert alleen de pagina, niet de layout;
  // zonder dit bleef het menu over de nieuwe pagina heen hangen.
  useEffect(() => setOpen(false), [pad]);

  const huidig = items.find((i) => actief(pad, i.href)) ?? items[0];
  const groepen = [...new Set(items.map((i) => i.groep))];
  const onderbalk = items.filter((i) => i.kort);

  const Uitloggen = (
    <form action={uitloggen}>
      <button
        type="submit"
        className="data w-full rounded-full border border-kastwit/25 px-3 py-2 text-xs text-kastwit/80 transition-colors hover:bg-kastwit hover:text-antraciet"
      >
        Uitloggen
      </button>
    </form>
  );

  const Lijst = (
    <nav aria-label="Beheer" className="space-y-6">
      {groepen.map((g) => (
        <div key={g}>
          <p className="data px-3 text-[10px] uppercase tracking-widest text-railstaal">{g}</p>
          <ul className="mt-2 space-y-0.5">
            {items
              .filter((i) => i.groep === g)
              .map((i) => {
                const aan = actief(pad, i.href);
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      aria-current={aan ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        aan
                          ? "bg-kastwit text-antraciet"
                          : "text-kastwit/70 hover:bg-kastwit/10 hover:text-kastwit"
                      }`}
                    >
                      <Icoon href={i.href} />
                      {i.label}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Laptop: zijbalk */}
      <aside className="hidden w-60 shrink-0 flex-col bg-antraciet px-3 py-6 text-kastwit lg:sticky lg:top-0 lg:flex lg:h-screen">
        <Link href="/dashboard" className="flex items-center gap-2 px-3">
          <span className="font-display text-xl">Blusbox</span>
          <span className="data rounded-full border border-kastwit/25 px-2 py-0.5 text-[10px] uppercase tracking-widest text-railstaal">
            beheer
          </span>
        </Link>
        <div className="mt-8 flex-1 overflow-y-auto">{Lijst}</div>
        <div className="space-y-3 border-t border-kastwit/10 px-3 pt-4">
          <p className="data truncate text-[11px] text-railstaal" title={email}>{email}</p>
          {Uitloggen}
        </div>
      </aside>

      {/* Telefoon: balk bovenaan */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-antraciet px-4 py-3 text-kastwit lg:hidden">
        <div className="min-w-0">
          <p className="data text-[10px] uppercase tracking-widest text-railstaal">Blusbox beheer</p>
          <p className="truncate font-display text-lg leading-tight">{huidig.label}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="beheermenu"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-kastwit/25"
        >
          <span className="sr-only">{open ? "Menu sluiten" : "Menu openen"}</span>
          <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </header>

      {open ? (
        <div id="beheermenu" className="fixed inset-x-0 bottom-0 top-[60px] z-30 overflow-y-auto bg-antraciet px-3 pb-28 pt-4 text-kastwit lg:hidden">
          {Lijst}
          <div className="mt-6 space-y-3 border-t border-kastwit/10 px-3 pt-4">
            <p className="data truncate text-[11px] text-railstaal">{email}</p>
            {Uitloggen}
          </div>
        </div>
      ) : null}

      {/* Telefoon: vaste knoppen onderin, binnen bereik van de duim */}
      <nav
        aria-label="Snelkoppelingen"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-railstaal/40 bg-kastwit/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${onderbalk.length + 1}, minmax(0, 1fr))` }}>
          {onderbalk.map((i) => {
            const aan = actief(pad, i.href);
            return (
              <li key={i.href}>
                <Link
                  href={i.href}
                  aria-current={aan ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${aan ? "text-antraciet" : "text-staal-tekst"}`}
                >
                  <Icoon href={i.href} />
                  {i.kort}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="beheermenu"
              className={`flex w-full flex-col items-center gap-1 py-2.5 text-[11px] ${open ? "text-antraciet" : "text-staal-tekst"}`}
            >
              <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
                <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={3} />
              </svg>
              Meer
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
