import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { InBeeld } from "@/components/site/in-beeld";
import { SectieLabel } from "@/components/ui/sectielabel";
import { Teller } from "@/components/site/teller";
import { INHOUD_GRAM } from "@/lib/product-facts";
import {
  IcoonOpvragen,
  IcoonRapport,
  IcoonTest,
} from "@/components/site/pictogrammen";

/**
 * "Nederlands getest": de module is getest door een Nederlands testbureau
 * en er ligt een Nederlands testrapport.
 *
 * Bron: opgave van de klant, 24 november 2026. Het rapport zelf is nog
 * niet aangeleverd. Daarom staat hier met opzet alleen dát er getest is en
 * dát de documenten op te vragen zijn: geen naam van het bureau, geen
 * norm, geen uitkomst. Vul die pas aan als het rapport er ligt en ze er
 * letterlijk in staan.
 *
 * De 40 gram komt uit lib/product-facts.ts (INHOUD_GRAM); zie daar.
 */

const OPVRAGEN = "/contact?onderwerp=documenten";

const punten = [
  {
    Icoon: IcoonTest,
    kop: "Nederlands testbureau",
    regel: "De module is in onze opdracht getest.",
  },
  {
    Icoon: IcoonRapport,
    kop: "Nederlands testrapport",
    regel: "De uitkomsten staan zwart op wit.",
  },
  {
    Icoon: IcoonOpvragen,
    kop: "Documenten op aanvraag",
    regel: "Testrapport en keuringsdocumenten sturen wij je toe.",
  },
];

const stap = (i: number) => ({ "--i": i }) as CSSProperties;

/** Een cirkel waar een ring omheen getekend wordt, met een vinkje. */
function Zegel({
  children,
  donker = false,
  klein = false,
}: {
  children: ReactNode;
  donker?: boolean;
  klein?: boolean;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${
        klein ? "h-10 w-10" : "h-14 w-14"
      } ${donker ? "bg-kastwit text-antraciet" : "bg-antraciet text-kastwit"}`}
    >
      {children}
      <svg
        aria-hidden
        viewBox="0 0 64 64"
        className="pointer-events-none absolute -inset-1.5 h-[calc(100%+0.75rem)] w-[calc(100%+0.75rem)] -rotate-90"
      >
        <circle
          className="getest-ring"
          cx="32"
          cy="32"
          r="30"
          fill="none"
          stroke="#4f9e78"
          strokeWidth="2"
          pathLength={1}
          strokeDasharray="1"
        />
      </svg>
      <span
        aria-hidden
        className={`getest-vink absolute -bottom-1 -right-1 inline-flex items-center justify-center rounded-full bg-[#2f7d57] text-white ring-2 ${
          klein ? "h-4 w-4" : "h-5 w-5"
        } ${donker ? "ring-antraciet" : "ring-kastwit"}`}
      >
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m2.5 6.2 2.2 2.3 4.8-5" />
        </svg>
      </span>
    </span>
  );
}

/**
 * De band op de homepage, direct onder de donkere voorwaardenrij. Licht,
 * zodat hij zich daarvan losmaakt; de drie punten komen na elkaar binnen
 * zodra de band in beeld schuift (zie `.getest` in globals.css).
 */
export function Getest() {
  return (
    <InBeeld
      as="section"
      aria-labelledby="getest-titel"
      className="getest bg-kastwit py-14 sm:py-20"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1fr_1.6fr] lg:items-center lg:gap-14">
        <div className="getest-in" style={stap(0)}>
          <SectieLabel>getest</SectieLabel>
          <h2
            id="getest-titel"
            className="font-display mt-4 text-[clamp(2.25rem,5vw,3.75rem)]"
          >
            Nederlands <span className="accent">getest.</span>
          </h2>
          <p className="mt-4 max-w-md text-staal-tekst">
            Wij hebben de Blusbox laten testen door een Nederlands testbureau.
            Het testrapport en de keuringsdocumenten liggen bij ons klaar. Wil
            je ze inzien? Vraag ze op, dan sturen wij ze toe.
          </p>
          <Link
            href={OPVRAGEN}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-antraciet px-6 py-3 text-sm font-medium text-kastwit transition-opacity hover:opacity-85"
          >
            Documenten opvragen
            <span aria-hidden>→</span>
          </Link>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <li
            style={stap(1)}
            className="getest-in flex items-center gap-4 rounded-2xl border border-railstaal/60 bg-white p-4 sm:p-5"
          >
            <Zegel>
              <span className="data text-[15px] font-medium leading-none">
                <Teller tot={INHOUD_GRAM} wachtMs={450} />
                <span className="text-[11px]">g</span>
              </span>
            </Zegel>
            <div className="min-w-0">
              <p className="font-medium leading-snug">{INHOUD_GRAM} gram blusaerosol</p>
              <p className="mt-1 text-sm leading-relaxed text-staal-tekst">
                Zoveel blusmiddel zit er in elke module.
              </p>
            </div>
          </li>
          {punten.map(({ Icoon, kop, regel }, i) => (
            <li
              key={kop}
              style={stap(i + 2)}
              className="getest-in flex items-center gap-4 rounded-2xl border border-railstaal/60 bg-white p-4 sm:p-5"
            >
              <Zegel>
                <Icoon className="h-6 w-6" />
              </Zegel>
              <div className="min-w-0">
                <p className="font-medium leading-snug">{kop}</p>
                <p className="mt-1 text-sm leading-relaxed text-staal-tekst">{regel}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </InBeeld>
  );
}

/**
 * De korte vorm voor in het koopblok op de productpagina (donkere
 * achtergrond): één tegel die doorlinkt naar het opvragen.
 */
export function GetestRegel() {
  return (
    <InBeeld className="getest">
      <Link
        href={OPVRAGEN}
        className="group flex items-center gap-3.5 rounded-2xl bg-gradient-to-b from-kastwit/[0.1] to-kastwit/[0.03] p-3.5 ring-1 ring-kastwit/20 transition-colors hover:ring-kastwit/40"
      >
        <Zegel donker klein>
          <IcoonTest className="h-5 w-5" />
        </Zegel>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium leading-tight">
            Getest door een Nederlands testbureau
          </span>
          <span className="mt-0.5 block text-[11px] leading-snug text-kastwit/60">
            Testrapport en documenten op aanvraag
          </span>
        </span>
        <span aria-hidden className="text-kastwit/50 transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    </InBeeld>
  );
}
