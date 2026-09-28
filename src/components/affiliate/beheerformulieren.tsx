"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  beoordeelAanvraag,
  corrigeerCommissie,
  keurRijpeGoed,
  maakUitbetaling,
  markeerUitbetaald,
  wijzigAffiliate,
  wijzigInstellingen,
  type BeheerStaat,
} from "@/app/dashboard/affiliates/acties";

/**
 * De beheerformulieren.
 *
 * Alles in één bestand omdat het varianten van hetzelfde zijn: een knop,
 * soms een reden, en een melding terug. Zeven losse bestandjes met
 * dezelfde useActionState-lus erin is meer schuifwerk dan overzicht.
 *
 * Handelingen die geld of toegang raken vragen eerst om bevestiging. Niet
 * om het lastig te maken, maar omdat "afwijzen" en "goedkeuren" naast
 * elkaar staan en een misklik daar niet terug te draaien is.
 */

const VELD =
  "data w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-2.5 py-1.5 text-xs";

function Knop({
  label,
  bevestiging,
  stijl = "rand",
}: {
  label: string;
  bevestiging?: string;
  stijl?: "rand" | "vol";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (bevestiging && !window.confirm(bevestiging)) e.preventDefault();
      }}
      className={
        stijl === "vol"
          ? "data rounded-full bg-antraciet px-4 py-1.5 text-xs text-kastwit transition-opacity hover:opacity-85 disabled:opacity-60"
          : "data rounded-full border border-antraciet px-3 py-1.5 text-xs transition-colors hover:bg-antraciet hover:text-kastwit disabled:opacity-60"
      }
    >
      {pending ? "Bezig…" : label}
    </button>
  );
}

function Melding({ staat }: { staat: BeheerStaat }) {
  if (staat.fase === "leeg") return null;
  return (
    <p
      role={staat.fase === "fout" ? "alert" : "status"}
      className={`data mt-2 text-xs ${
        staat.fase === "fout" ? "text-blusrood-op-licht" : "text-staal-tekst"
      }`}
    >
      {staat.melding}
    </p>
  );
}

/* ----------------------------------------------------- aanvraag beoordelen */

export function AanvraagKnoppen({
  affiliateId,
  slug,
  status,
}: {
  affiliateId: string;
  slug: string;
  status: string;
}) {
  const [staat, actie] = useActionState<BeheerStaat, FormData>(
    beoordeelAanvraag,
    { fase: "leeg" },
  );
  const [reden, setReden] = useState("");

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {status !== "goedgekeurd" && (
          <form action={actie}>
            <input type="hidden" name="affiliateId" value={affiliateId} />
            <input type="hidden" name="besluit" value="goedgekeurd" />
            <input type="hidden" name="reden" value={reden} />
            <Knop
              label="Goedkeuren"
              stijl="vol"
              bevestiging={`${slug} goedkeuren? De persoonlijke link gaat daarmee werken.`}
            />
          </form>
        )}

        {status === "aangevraagd" && (
          <form action={actie}>
            <input type="hidden" name="affiliateId" value={affiliateId} />
            <input type="hidden" name="besluit" value="afgewezen" />
            <input type="hidden" name="reden" value={reden} />
            <Knop label="Afwijzen" bevestiging={`${slug} afwijzen?`} />
          </form>
        )}

        {status === "goedgekeurd" && (
          <form action={actie}>
            <input type="hidden" name="affiliateId" value={affiliateId} />
            <input type="hidden" name="besluit" value="geschorst" />
            <input type="hidden" name="reden" value={reden} />
            <Knop
              label="Schorsen"
              bevestiging={`${slug} schorsen? De link stopt direct met werken.`}
            />
          </form>
        )}
      </div>

      <input
        value={reden}
        onChange={(e) => setReden(e.target.value)}
        placeholder="Reden (verplicht bij afwijzen of schorsen)"
        className={`${VELD} mt-2`}
      />
      <Melding staat={staat} />
    </div>
  );
}

/* ------------------------------------------------------- slug en tarief */

export function AffiliateWijzigen({
  affiliateId,
  slug,
  percentage,
}: {
  affiliateId: string;
  slug: string;
  percentage: string;
}) {
  const [staat, actie] = useActionState<BeheerStaat, FormData>(wijzigAffiliate, {
    fase: "leeg",
  });

  return (
    <form action={actie} className="space-y-2">
      <input type="hidden" name="affiliateId" value={affiliateId} />
      <div className="flex flex-wrap gap-2">
        <input
          name="slug"
          defaultValue={slug}
          aria-label="Slug"
          className={`${VELD} max-w-[10rem]`}
        />
        <input
          name="percentage"
          defaultValue={percentage}
          aria-label="Percentage"
          placeholder="20"
          className={`${VELD} max-w-[5rem]`}
        />
        <Knop label="Opslaan" />
      </div>
      <Melding staat={staat} />
    </form>
  );
}

/* ------------------------------------------------------------ commissie */

export function CommissieCorrectie({
  commissieId,
  status,
}: {
  commissieId: string;
  status: string;
}) {
  const [staat, actie] = useActionState<BeheerStaat, FormData>(
    corrigeerCommissie,
    { fase: "leeg" },
  );
  const [reden, setReden] = useState("");

  if (status === "uitbetaald") {
    return <span className="data text-xs text-staal-tekst">afgerond</span>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {status !== "goedgekeurd" && (
          <form action={actie}>
            <input type="hidden" name="commissieId" value={commissieId} />
            <input type="hidden" name="besluit" value="goedgekeurd" />
            <input type="hidden" name="reden" value={reden} />
            <Knop label="Goedkeuren" bevestiging="Commissie goedkeuren?" />
          </form>
        )}
        <form action={actie}>
          <input type="hidden" name="commissieId" value={commissieId} />
          <input type="hidden" name="besluit" value="geblokkeerd" />
          <input type="hidden" name="reden" value={reden} />
          <Knop label="Blokkeren" bevestiging="Commissie blokkeren?" />
        </form>
        <form action={actie}>
          <input type="hidden" name="commissieId" value={commissieId} />
          <input type="hidden" name="besluit" value="teruggedraaid" />
          <input type="hidden" name="reden" value={reden} />
          <Knop
            label="Terugdraaien"
            bevestiging="Commissie terugdraaien? Het bedrag wordt nul."
          />
        </form>
      </div>
      <input
        value={reden}
        onChange={(e) => setReden(e.target.value)}
        placeholder="Reden (verplicht)"
        className={`${VELD} mt-1.5`}
      />
      <Melding staat={staat} />
    </div>
  );
}

export function RijpeGoedkeuren() {
  const [staat, actie] = useActionState<BeheerStaat, FormData>(keurRijpeGoed, {
    fase: "leeg",
  });
  return (
    <form action={actie}>
      <Knop
        label="Rijpe commissies goedkeuren"
        stijl="vol"
        bevestiging="Alle commissies waarvan de bedenktijd voorbij is goedkeuren?"
      />
      <Melding staat={staat} />
    </form>
  );
}

/* --------------------------------------------------------- uitbetalingen */

export function UitbetalingMaken({
  affiliateId,
  slug,
  bedrag,
}: {
  affiliateId: string;
  slug: string;
  bedrag: string;
}) {
  const [staat, actie] = useActionState<BeheerStaat, FormData>(maakUitbetaling, {
    fase: "leeg",
  });
  return (
    <form action={actie}>
      <input type="hidden" name="affiliateId" value={affiliateId} />
      <Knop
        label="Uitbetaling klaarzetten"
        bevestiging={`Uitbetaling van ${bedrag} klaarzetten voor ${slug}?`}
      />
      <Melding staat={staat} />
    </form>
  );
}

export function UitbetalingAfboeken({
  uitbetalingId,
  bedrag,
}: {
  uitbetalingId: string;
  bedrag: string;
}) {
  const [staat, actie] = useActionState<BeheerStaat, FormData>(
    markeerUitbetaald,
    { fase: "leeg" },
  );
  return (
    <form action={actie} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="uitbetalingId" value={uitbetalingId} />
      <input
        name="referentie"
        placeholder="Betaalkenmerk"
        aria-label="Betaalkenmerk"
        className={`${VELD} max-w-[11rem]`}
      />
      <Knop
        label="Afboeken"
        bevestiging={`${bedrag} als betaald markeren? Dit kan niet ongedaan worden gemaakt.`}
      />
      <Melding staat={staat} />
    </form>
  );
}

/* ---------------------------------------------------------- instellingen */

export function Instellingenformulier({
  percentage,
  dagen,
  drempel,
  frequentie,
  actief,
}: {
  percentage: string;
  dagen: number;
  drempel: string;
  frequentie: string;
  actief: boolean;
}) {
  const [staat, actie] = useActionState<BeheerStaat, FormData>(
    wijzigInstellingen,
    { fase: "leeg" },
  );

  return (
    <form action={actie} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="percentage" className="block text-xs font-medium">
            Standaardcommissie (%)
          </label>
          <input
            id="percentage"
            name="percentage"
            defaultValue={percentage}
            className={`${VELD} mt-1`}
          />
        </div>
        <div>
          <label htmlFor="dagen" className="block text-xs font-medium">
            Attributie (dagen)
          </label>
          <input
            id="dagen"
            name="dagen"
            type="number"
            min={1}
            max={365}
            defaultValue={dagen}
            className={`${VELD} mt-1`}
          />
        </div>
        <div>
          <label htmlFor="drempel" className="block text-xs font-medium">
            Drempel (€)
          </label>
          <input
            id="drempel"
            name="drempel"
            defaultValue={drempel}
            className={`${VELD} mt-1`}
          />
        </div>
        <div>
          <label htmlFor="frequentie" className="block text-xs font-medium">
            Frequentie
          </label>
          <select
            id="frequentie"
            name="frequentie"
            defaultValue={frequentie}
            className={`${VELD} mt-1`}
          >
            <option value="maandelijks">Maandelijks</option>
            <option value="handmatig">Handmatig</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          name="actief"
          value="ja"
          defaultChecked={actief}
          className="h-4 w-4"
        />
        Programma staat aan (uit betekent: geen nieuwe aanmeldingen, geen
        attributie, geen commissie)
      </label>

      <Knop label="Instellingen opslaan" stijl="vol" />
      <Melding staat={staat} />
    </form>
  );
}
