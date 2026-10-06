"use client";

import Image from "next/image";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { zetRookmelder } from "@/app/afrekenen/rookmelder-acties";
import { ROOKMELDER_SLUG, vindItem } from "@/lib/catalogus";
import { euro } from "@/lib/pricing";

/**
 * Het rookmelderaanbod in de bestellingssamenvatting.
 *
 * De verkooptekst komt niet van een marketingafdeling maar van de site
 * zelf: Blusbox vervangt een rookmelder niet, het is een andere laag. Een
 * rookmelder waarschuwt jou, Blusbox grijpt in de meterkast in. Dat
 * verhaal staat al in de veelgestelde vragen, dus het aanbod is een
 * logisch vervolg en geen opdringerige extra.
 *
 * Eén klik, zonder pagina te verlaten. De foto's van de fabrikant staan
 * achter "Meer informatie", in een venster: wie twijfelt kan kijken, wie
 * het al weet hoeft niets te openen.
 */

// Uit de catalogus, zodat aanbod en afrekening nooit uiteenlopen.
export const PRIJS = euro(vindItem(ROOKMELDER_SLUG)?.prijsInclBtwCenten ?? 0);

export const FOTOS = [
  { src: "/media/rookmelder/binnenkant.webp", alt: "Opengewerkte rookmelder: luidspreker van 85 dB, optische sensor, test- en pauzeknop en batterij" },
  { src: "/media/rookmelder/kamers.webp", alt: "De rookmelder in slaapkamer, woonkamer, garderobe en hal, met iconen voor 85 dB-alarm en lege-batterijwaarschuwing" },
  { src: "/media/rookmelder/installeren.webp", alt: "Montage aan het plafond met de meegeleverde bevestigingsplaat" },
  { src: "/media/rookmelder/afmetingen.webp", alt: "Afmetingen: doorsnede 89,5 mm, hoogte 35 mm" },
  { src: "/media/rookmelder/batterij.webp", alt: "Batterij gaat na activatie een jaar mee" },
];

export const FEITEN = [
  ["Norm", "EN 14604"],
  ["Sensor", "Optisch"],
  ["Alarm", "85 dB op 3 meter"],
  ["Batterij", "Inbegrepen, gaat 1 jaar mee, vervangbaar"],
  ["Bediening", "Testknop, melding bij lege batterij"],
  ["Formaat", "Ø 89,5 × 35 mm, 90 gram"],
  ["Montage", "Plafond, bevestigingsmateriaal inbegrepen"],
  ["Garantie", "2 jaar, van ELRO"],
] as const;

function Knop({ aan }: { aan: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={aan}
      className={
        aan
          ? "data rounded-full border border-antraciet px-4 py-2 text-xs transition-colors hover:bg-antraciet hover:text-kastwit disabled:opacity-60"
          : "rounded-full bg-antraciet px-4 py-2 text-sm font-medium text-kastwit transition-opacity hover:opacity-85 disabled:opacity-60"
      }
    >
      {pending ? "Bezig…" : aan ? "Verwijderen" : `Voeg toe · ${PRIJS}`}
    </button>
  );
}

function Schakelaar({ aan }: { aan: boolean }) {
  return (
    <form action={zetRookmelder}>
      <input type="hidden" name="aan" value={aan ? "nee" : "ja"} />
      <Knop aan={aan} />
    </form>
  );
}

export function Rookmelderaanbod({ inWagen }: { inWagen: boolean }) {
  const venster = useRef<HTMLDialogElement>(null);

  return (
    <div
      className={`mt-5 rounded-2xl border-2 p-4 transition-colors ${
        inWagen ? "border-antraciet/20 bg-kastwit-dim" : "border-antraciet bg-kastwit"
      }`}
    >
      <div className="flex gap-4">
        <Image
          src="/media/rookmelder/rookmelder-klein.webp"
          alt="ELRO rookmelder FS1801"
          width={72}
          height={72}
          className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0">
          <p className="data text-[11px] uppercase tracking-widest text-staal-tekst">
            {inWagen ? "Toegevoegd" : "Maak het compleet"}
          </p>
          <p className="mt-0.5 font-medium leading-snug">
            Rookmelder erbij{" "}
            <span className="data whitespace-nowrap text-sm">+ {PRIJS}</span>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-staal-tekst">
            Blusbox grijpt in de meterkast in; een rookmelder waarschuwt jou.
            Sinds 1 juli 2022 verplicht op elke woonverdieping.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => venster.current?.showModal()}
          className="data text-xs underline underline-offset-4 hover:text-staal-tekst"
        >
          Meer informatie
        </button>
        <Schakelaar aan={inWagen} />
      </div>

      <dialog
        ref={venster}
        aria-labelledby="rookmelder-titel"
        // Klik op de donkere achtergrond sluit het venster.
        onClick={(e) => {
          if (e.target === venster.current) venster.current?.close();
        }}
        className="m-auto max-h-[92dvh] w-[min(40rem,94vw)] overflow-y-auto rounded-3xl bg-kastwit p-0 text-antraciet backdrop:bg-antraciet/70 backdrop:backdrop-blur-sm"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-railstaal/40 bg-kastwit/95 px-5 py-3 backdrop-blur">
          <p id="rookmelder-titel" className="font-medium">
            ELRO rookmelder FS1801
          </p>
          <button
            type="button"
            onClick={() => venster.current?.close()}
            aria-label="Sluiten"
            className="rounded-full p-2 text-lg leading-none hover:bg-kastwit-dim"
          >
            ×
          </button>
        </div>

        {/* Foto's naast elkaar, vegen op mobiel. */}
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pt-5 [scrollbar-width:thin]">
          {FOTOS.map((f) => (
            <Image
              key={f.src}
              src={f.src}
              alt={f.alt}
              width={900}
              height={900}
              sizes="(min-width: 640px) 26rem, 80vw"
              className="aspect-square w-[80%] shrink-0 snap-center rounded-2xl bg-white object-contain sm:w-[26rem]"
            />
          ))}
        </div>

        <div className="px-5 pb-5">
          <p className="mt-4 text-sm leading-relaxed text-staal-tekst">
            Een rookmelder en Blusbox doen elk iets anders. De rookmelder hangt
            aan het plafond en waarschuwt jou zodra er rook is, waar in huis
            ook. Blusbox zit in de meterkast en dooft daar een beginnende brand,
            ook als er niemand thuis is.
          </p>

          <dl className="mt-4 divide-y divide-railstaal/40 border-y border-railstaal/40 text-sm">
            {FEITEN.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[7rem_1fr] gap-3 py-2">
                <dt className="text-staal-tekst">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="data text-lg">
              {PRIJS} <span className="text-xs text-staal-tekst">incl. btw</span>
            </p>
            <Schakelaar aan={inWagen} />
          </div>
        </div>
      </dialog>
    </div>
  );
}
