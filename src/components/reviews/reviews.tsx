import {
  REVIEWS,
  gemiddeldeWaardering,
  sterrenVerdeling,
  type Review,
} from "@/lib/reviews";
import { formatteerNl } from "@/lib/levensduur";
import { Sterren } from "./sterren";

/**
 * Beoordelingen: gemiddelde, verdeling en de reacties zelf.
 *
 * Rendert niets zolang er geen reviews zijn. Een leeg kader met "nog geen
 * beoordelingen" trekt juist de aandacht naar wat er ontbreekt, en op een
 * winkel die net begint is dat het laatste wat je wil.
 *
 * De verdeling per sterrenaantal staat er bewust bij, ook als hij niet
 * vleiend is. Een rij van alleen maar vijven leest als gekocht; een paar
 * vieren ertussen maakt het geheel geloofwaardiger dan een perfecte score.
 */

function Kaart({ review }: { review: Review }) {
  return (
    <li className="flex h-full flex-col rounded-2xl border border-railstaal/40 bg-kastwit p-5">
      <Sterren waarde={review.sterren} />

      <p className="mt-3 font-medium leading-snug text-antraciet">{review.kop}</p>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-staal-tekst">
        {review.tekst}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-railstaal/40 pt-3">
        <span className="data text-xs text-antraciet">{review.naam}</span>
        {review.plaats && (
          <span className="data text-xs text-staal-tekst">· {review.plaats}</span>
        )}
        <span className="data ml-auto text-[11px] text-staal-tekst">
          {formatteerNl(review.datum.slice(0, 10))}
        </span>
      </div>

      {review.geverifieerd && (
        <p className="data mt-2 text-[11px] uppercase tracking-widest text-blusrood-op-licht">
          Geverifieerde koper
        </p>
      )}
    </li>
  );
}

export function Reviews({
  reviews = REVIEWS,
  titel = "Wat kopers zeggen",
  maxAantal = 6,
}: {
  reviews?: Review[];
  titel?: string;
  maxAantal?: number;
}) {
  const gemiddelde = gemiddeldeWaardering(reviews);
  if (gemiddelde === null) return null;

  const verdeling = sterrenVerdeling(reviews);

  return (
    <section className="bg-kastwit-dim py-24" aria-labelledby="reviews-kop">
      <div className="mx-auto max-w-6xl px-6">
        <h2 id="reviews-kop" className="font-display text-3xl sm:text-4xl">
          {titel}
        </h2>

        <div className="mt-8 grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-12">
          <div>
            <p className="font-display text-5xl leading-none text-antraciet">
              {gemiddelde.toString().replace(".", ",")}
            </p>
            <div className="mt-2">
              <Sterren waarde={gemiddelde} maat="h-5 w-5" />
            </div>
            <p className="data mt-2 text-xs text-staal-tekst">
              {reviews.length}{" "}
              {reviews.length === 1 ? "beoordeling" : "beoordelingen"}
            </p>
          </div>

          {/* Verdeling. De balk is een achtergrond met een breedte, geen
              <progress>: die laat zich in geen enkele browser gelijk
              opmaken en we tonen hier geen voortgang maar een aandeel. */}
          <ul className="max-w-sm space-y-1.5">
            {verdeling.map((rij) => (
              <li key={rij.sterren} className="flex items-center gap-3">
                <span className="data w-8 shrink-0 text-xs text-staal-tekst">
                  {rij.sterren}★
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-railstaal/30">
                  <span
                    className="block h-full rounded-full bg-blusrood"
                    style={{ width: `${rij.deel * 100}%` }}
                  />
                </span>
                <span className="data w-6 shrink-0 text-right text-xs text-staal-tekst">
                  {rij.aantal}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, maxAantal).map((r, i) => (
            <Kaart key={`${r.naam}-${i}`} review={r} />
          ))}
        </ul>

        <p className="mt-6 max-w-2xl text-xs text-staal-tekst">
          Beoordelingen komen van mensen die de Blusbox bij ons gekocht
          hebben. Wij plaatsen ze ongewijzigd en verwijderen geen kritiek.
        </p>
      </div>
    </section>
  );
}
