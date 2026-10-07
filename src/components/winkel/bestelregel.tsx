"use client";

import Image from "next/image";
import { useFormStatus } from "react-dom";
import { verwijderUitWagen, wijzigWagenAantal } from "@/app/winkelwagen/acties";

/**
 * Eén artikel in de samenvatting bij het afrekenen, met foto en aantal.
 *
 * Het hoofdproduct krijgt de grote weergave. Stond de Blusbox er als kaal
 * tekstregeltje en de rookmelder eronder als kaart met foto, dan trok de
 * bijzaak de aandacht weg van waar de klant voor kwam.
 *
 * Plus en min zijn elk een eigen formulier met het nieuwe aantal erin.
 * Werkt zonder JavaScript en kan niet uit de pas lopen met de server: het
 * getal dat je ziet komt na elke klik opnieuw uit de winkelwagen.
 */

function Stapknop({ label, children }: { label: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center text-base text-antraciet/80 transition-colors hover:bg-antraciet/10 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Stap({
  slug,
  aantal,
  label,
  teken,
}: {
  slug: string;
  aantal: number;
  label: string;
  teken: string;
}) {
  return (
    <form action={wijzigWagenAantal}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="aantal" value={aantal} />
      <Stapknop label={label}>{teken}</Stapknop>
    </form>
  );
}

export function Bestelregel({
  slug,
  naam,
  foto,
  aantal,
  stukprijs,
  regelprijs,
  groot,
}: {
  slug: string;
  naam: string;
  foto: string;
  aantal: number;
  /** Al opgemaakt, inclusief btw en eventuele korting. */
  stukprijs: string;
  regelprijs: string;
  /** Het hoofdproduct: grotere foto. */
  groot: boolean;
}) {
  return (
    <li className={`flex gap-4 ${groot ? "items-center" : "items-start"}`}>
      <div
        className={`relative shrink-0 overflow-hidden rounded-2xl bg-kastwit-dim ring-1 ring-railstaal/40 ${
          groot ? "h-24 w-24" : "h-14 w-14"
        }`}
      >
        <Image src={foto} alt="" fill sizes={groot ? "96px" : "56px"} className="object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p
            className={`min-w-0 break-words hyphens-auto ${
              groot ? "font-display text-lg leading-tight" : "text-sm font-medium leading-snug"
            }`}
          >
            {naam}
          </p>
          <p className="data shrink-0 text-sm">{regelprijs}</p>
        </div>
        <p className="data mt-0.5 text-xs text-staal-tekst">{stukprijs} per stuk</p>

        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center overflow-hidden rounded-full border border-railstaal">
            <Stap slug={slug} aantal={aantal - 1} label={`Eén ${naam} minder`} teken="−" />
            <span className="data w-8 text-center text-sm" aria-live="polite">
              {aantal}
            </span>
            <Stap slug={slug} aantal={aantal + 1} label={`Eén ${naam} meer`} teken="+" />
          </div>
          <form action={verwijderUitWagen}>
            <input type="hidden" name="slug" value={slug} />
            <button
              type="submit"
              className="data text-xs text-staal-tekst underline underline-offset-4 hover:text-blusrood-op-licht"
            >
              Verwijderen
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}
