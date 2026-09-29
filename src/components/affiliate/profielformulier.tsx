"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { slaProfielOp, type ProfielStaat } from "@/app/affiliate/profiel-acties";

/**
 * Het profiel van een affiliate: contactgegevens, link en uitbetaling.
 *
 * De uitbetaalgegevens staan hier omdat er anders niet betaald kan worden:
 * het veld bestond wel in de database maar was nergens in te vullen, en in
 * het beheerscherm stond daardoor bij iedereen "niet opgegeven".
 *
 * Het rekeningnummer wordt bij het laden niet volledig getoond maar
 * afgekort. Wie het wil wijzigen typt het opnieuw; wie alleen even kijkt
 * hoeft niet zijn hele IBAN op het scherm te hebben staan in een
 * treinstel vol mensen.
 */

function Knop() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-antraciet px-6 py-2.5 text-sm text-kastwit transition-opacity hover:opacity-85 disabled:opacity-60"
    >
      {pending ? "Opslaan…" : "Opslaan"}
    </button>
  );
}

const VELD =
  "mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-3 py-2.5 text-sm";

export function Profielformulier({
  slug,
  bedrijfsnaam,
  website,
  kanalen,
  rekeningAfgekort,
  tenNameVan,
  slugVast,
}: {
  slug: string;
  bedrijfsnaam: string;
  website: string;
  kanalen: string;
  rekeningAfgekort: string;
  tenNameVan: string;
  /** Er is al commissie opgebouwd; de link mag dan niet meer wijzigen. */
  slugVast: boolean;
}) {
  const [staat, actie] = useActionState<ProfielStaat, FormData>(slaProfielOp, {
    fase: "leeg",
  });

  return (
    <form action={actie} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="bedrijfsnaam" className="block text-sm font-medium">
            Bedrijfsnaam
            <span className="ml-1.5 text-xs font-normal text-staal-tekst">
              optioneel
            </span>
          </label>
          <input
            id="bedrijfsnaam"
            name="bedrijfsnaam"
            defaultValue={bedrijfsnaam}
            className={VELD}
          />
        </div>
        <div>
          <label htmlFor="website" className="block text-sm font-medium">
            Website
            <span className="ml-1.5 text-xs font-normal text-staal-tekst">
              optioneel
            </span>
          </label>
          <input
            id="website"
            name="website"
            type="url"
            defaultValue={website}
            placeholder="https://"
            className={VELD}
          />
        </div>
      </div>

      <div>
        <label htmlFor="kanalen" className="block text-sm font-medium">
          Sociale kanalen
          <span className="ml-1.5 text-xs font-normal text-staal-tekst">
            optioneel
          </span>
        </label>
        <input id="kanalen" name="kanalen" defaultValue={kanalen} className={VELD} />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium">
          Naam in je link
        </label>
        <p className="mt-0.5 text-xs text-staal-tekst">
          {slugVast
            ? "Je link staat vast zodra er commissie op staat — hij circuleert al bij je publiek."
            : "blusbox.nl/r/… — kleine letters, cijfers en koppeltekens."}
        </p>
        <input
          id="slug"
          name="slug"
          defaultValue={slug}
          readOnly={slugVast}
          className={`${VELD} ${slugVast ? "bg-kastwit-dim text-staal-tekst" : ""}`}
        />
      </div>

      <fieldset className="rounded-2xl border border-railstaal/60 bg-kastwit-dim p-5">
        <legend className="px-2 text-sm font-medium">Uitbetaling</legend>
        <p className="mt-1 text-xs text-staal-tekst">
          Zonder rekeningnummer kunnen we niet uitbetalen. Wij bewaren alleen
          het nummer en de naam — verder niets.
        </p>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="rekening" className="block text-sm font-medium">
              IBAN
            </label>
            <input
              id="rekening"
              name="rekening"
              defaultValue=""
              placeholder={rekeningAfgekort || "NL00 BANK 0000 0000 00"}
              autoComplete="off"
              className={`${VELD} font-mono`}
            />
            {rekeningAfgekort && (
              <p className="mt-1 text-xs text-staal-tekst">
                Nu bekend: {rekeningAfgekort}. Laat leeg om het zo te laten.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="tenNameVan" className="block text-sm font-medium">
              Ten name van
            </label>
            <input
              id="tenNameVan"
              name="tenNameVan"
              defaultValue={tenNameVan}
              className={VELD}
            />
          </div>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <Knop />
        {staat.fase !== "leeg" && (
          <p
            role={staat.fase === "fout" ? "alert" : "status"}
            className={`data text-xs ${
              staat.fase === "fout" ? "text-blusrood-op-licht" : "text-staal-tekst"
            }`}
          >
            {staat.melding}
          </p>
        )}
      </div>
    </form>
  );
}
