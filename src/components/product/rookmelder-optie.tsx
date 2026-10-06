"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { FEITEN, FOTOS, PRIJS } from "@/components/winkel/rookmelderaanbod";

/**
 * Rookmelder erbij, als vinkje in het koopblok van de productpagina.
 *
 * Een vinkje en geen eigen knop: hij gaat mee met "Koop nu" of "In
 * winkelwagen". Zo blijft het één beslissing en één klik, en hoeft de
 * klant geen twee dingen in volgorde te doen.
 *
 * Het vinkje staat buiten het <form>, maar hoort er via het form-attribuut
 * wél bij. Daardoor kan het op laptops naast de knoppen staan en op
 * telefoons eronder, zonder dat de opmaak de formulierstructuur bepaalt.
 */
export function RookmelderOptie({ formulier }: { formulier: string }) {
  const [aan, setAan] = useState(false);
  const venster = useRef<HTMLDialogElement>(null);

  return (
    <div
      className={`rounded-2xl border p-3.5 transition-colors ${
        aan
          ? "border-kastwit/50 bg-kastwit/[0.09]"
          : "border-kastwit/15 bg-kastwit/[0.04] hover:border-kastwit/30"
      }`}
    >
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          name="rookmelder"
          value="ja"
          form={formulier}
          checked={aan}
          onChange={(e) => setAan(e.target.checked)}
          className="h-5 w-5 shrink-0 cursor-pointer rounded accent-blusrood-vlak"
        />
        <Image
          src="/media/rookmelder/rookmelder-klein.webp"
          alt=""
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-xl object-cover"
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium leading-snug">
            Rookmelder erbij
          </span>
          <span className="data block text-sm text-kastwit/80">+ {PRIJS}</span>
          <span className="block text-[11px] leading-snug text-kastwit/55">
            ELRO FS1801 · EN 14604
          </span>
        </span>
      </label>

      <button
        type="button"
        onClick={() => venster.current?.showModal()}
        className="data mt-2 text-[11px] text-kastwit/60 underline underline-offset-4 hover:text-kastwit"
      >
        Waarom een rookmelder?
      </button>

      <dialog
        ref={venster}
        aria-labelledby="optie-titel"
        onClick={(e) => {
          if (e.target === venster.current) venster.current?.close();
        }}
        className="m-auto max-h-[92dvh] w-[min(40rem,94vw)] overflow-y-auto rounded-3xl bg-kastwit p-0 text-antraciet backdrop:bg-antraciet/70 backdrop:backdrop-blur-sm"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-railstaal/40 bg-kastwit/95 px-5 py-3 backdrop-blur">
          <p id="optie-titel" className="font-medium">
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
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pt-5">
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
            ook als er niemand thuis is. Rookmelders zijn sinds 1 juli 2022
            verplicht op elke woonverdieping.
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
            <button
              type="button"
              onClick={() => {
                setAan(true);
                venster.current?.close();
              }}
              className="rounded-full bg-antraciet px-5 py-2.5 text-sm font-medium text-kastwit transition-opacity hover:opacity-85"
            >
              {aan ? "Staat aangevinkt" : "Vink aan bij mijn bestelling"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
