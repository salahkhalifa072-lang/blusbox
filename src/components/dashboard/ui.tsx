import Link from "next/link";
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

/** Shared dashboard primitives, so pages stay mostly data. */

export function Tegel({
  label,
  waarde,
  toelichting,
  nadruk = false,
}: {
  label: string;
  waarde: string;
  toelichting?: string;
  /** Draws attention to a number that needs action, not just a big one. */
  nadruk?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-kastwit p-4 sm:p-5 ${
        nadruk ? "border-signaal" : "border-railstaal/50"
      }`}
    >
      <p className="data break-words text-[10px] uppercase tracking-widest text-staal-tekst sm:text-[11px]">
        {label}
      </p>
      <p className="data mt-2 whitespace-nowrap text-lg sm:text-2xl">{waarde}</p>
      {toelichting ? (
        <p className="mt-1 hyphens-auto break-words text-xs leading-snug text-staal-tekst">
          {toelichting}
        </p>
      ) : null}
    </div>
  );
}

export function Paneel({
  titel,
  actie,
  children,
}: {
  titel: string;
  actie?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-railstaal/50 bg-kastwit">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-railstaal/50 px-4 py-4 sm:px-5">
        <h2 className="font-display text-lg sm:text-xl">{titel}</h2>
        {actie}
      </div>
      {/*
        tabIndex maakt de horizontale scroll bereikbaar met het toetsenbord.
        De dashboardtabellen zijn breder dan een smal scherm; zonder dit kun
        je met alleen een toetsenbord niet bij de rechterkolommen — en daar
        staan juist de knoppen. Een benoemde regio, anders is het een
        naamloos focuspunt in de tabvolgorde.
      */}
      <div
        role="region"
        aria-label={titel}
        tabIndex={0}
        // relative: de sr-only labels in de tabel staan absoluut. Zonder een
        // gepositioneerde ouder ontsnapten ze uit dit scrollvak en maakten
        // ze de hele pagina op een telefoon 887 px breed.
        className="relative overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-antraciet"
      >
        {children}
      </div>
    </section>
  );
}

/*
 * Op een telefoon wordt elke rij een kaart: de eerste cel als titel, de
 * rest als label-waardeparen. Dezelfde markup als op de laptop, alleen
 * anders weergegeven — de pagina's hoeven er niets voor te doen. Tabel
 * geeft de koppen door aan elke Rij, Rij geeft elke Cel zijn kop.
 */
export function Tabel({
  koppen,
  children,
}: {
  koppen: string[];
  children: ReactNode;
}) {
  return (
    <table className="block w-full border-collapse text-sm md:table md:min-w-[42rem]">
      <thead className="hidden md:table-header-group">
        <tr className="border-b border-railstaal/40">
          {koppen.map((k) => (
            <th
              key={k}
              scope="col"
              className="data px-5 py-3 text-left text-[11px] font-normal uppercase tracking-widest text-staal-tekst"
            >
              {k}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="block md:table-row-group">
        {Children.map(children, (rij) =>
          isValidElement(rij)
            ? cloneElement(rij as ReactElement<{ koppen?: string[] }>, { koppen })
            : rij,
        )}
      </tbody>
    </table>
  );
}

export function Rij({
  children,
  koppen,
}: {
  children: ReactNode;
  /** Gezet door Tabel; niet zelf meegeven. */
  koppen?: string[];
}) {
  return (
    <tr className="block border-b border-railstaal/25 px-4 py-3 last:border-0 md:table-row md:p-0">
      {Children.map(children, (cel, i) =>
        isValidElement(cel)
          ? cloneElement(cel as ReactElement<{ label?: string; eerste?: boolean }>, {
              label: koppen?.[i],
              eerste: i === 0,
            })
          : cel,
      )}
    </tr>
  );
}

export function Cel({
  children,
  mono = false,
  label,
  eerste = false,
}: {
  children: ReactNode;
  mono?: boolean;
  /** Gezet door Rij: de kolomkop, als label op een telefoon. */
  label?: string;
  eerste?: boolean;
}) {
  return (
    <td
      data-label={label}
      className={`align-top md:table-cell md:px-5 md:py-3 ${mono ? "data md:whitespace-nowrap" : ""} ${
        eerste
          ? "block pb-1 text-base font-medium md:text-sm md:font-normal"
          : "grid grid-cols-[6.5rem_minmax(0,1fr)] items-start justify-items-start gap-3 py-1 before:content-[attr(data-label)] before:pt-0.5 before:font-[family-name:var(--font-mono)] before:text-[10px] before:uppercase before:tracking-widest before:text-staal-tekst md:before:content-none"
      }`}
    >
      {children}
    </td>
  );
}

const statusKleur: Record<string, string> = {
  nieuw: "border-railstaal text-staal-tekst",
  betaald: "border-antraciet text-antraciet",
  in_behandeling: "border-antraciet text-antraciet",
  verzonden: "border-antraciet text-antraciet",
  geleverd: "border-antraciet/40 text-staal-tekst",
  geannuleerd: "border-blusrood-op-licht text-blusrood-op-licht",
  terugbetaald: "border-blusrood-op-licht text-blusrood-op-licht",
  aangemeld: "border-signaal text-antraciet",
  goedgekeurd: "border-antraciet text-antraciet",
  ontvangen: "border-antraciet text-antraciet",
  afgewezen: "border-blusrood-op-licht text-blusrood-op-licht",
};

export function Status({ waarde }: { waarde: string }) {
  return (
    <span
      className={`data inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] ${
        statusKleur[waarde] ?? "border-railstaal text-staal-tekst"
      }`}
    >
      {waarde.replace(/_/g, " ")}
    </span>
  );
}

export function Leeg({ tekst }: { tekst: string }) {
  return <p className="px-4 py-8 text-sm text-staal-tekst sm:px-5">{tekst}</p>;
}

export type Taak = { aantal: number; tekst: string; href: string; dringend?: boolean };

/**
 * "Te doen": alleen wat aandacht vraagt, met een directe link ernaartoe.
 * Staat er niets, dan zegt het blok dat ook — een leeg dashboard is op een
 * drukke dag precies het antwoord dat je zoekt.
 */
export function TeDoen({ taken }: { taken: Taak[] }) {
  const open = taken.filter((t) => t.aantal > 0);
  return (
    <section aria-labelledby="tedoen-titel" className="rounded-2xl border border-railstaal/50 bg-kastwit">
      <div className="flex items-center justify-between gap-3 border-b border-railstaal/50 px-4 py-4 sm:px-5">
        <h2 id="tedoen-titel" className="font-display text-lg sm:text-xl">Te doen</h2>
        <span className="data text-xs text-staal-tekst">
          {open.length === 0 ? "alles bijgewerkt" : `${open.reduce((n, t) => n + t.aantal, 0)} open`}
        </span>
      </div>
      {open.length === 0 ? (
        <p className="flex items-center gap-2 px-4 py-5 text-sm text-staal-tekst sm:px-5">
          <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-[#2f9e5c]" />
          Er wacht niets op je. Nieuwe bestellingen en aanvragen verschijnen hier vanzelf.
        </p>
      ) : (
        <ul className="divide-y divide-railstaal/25">
          {open.map((t) => (
            <li key={t.href + t.tekst}>
              <Link
                href={t.href}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-kastwit-dim sm:px-5"
              >
                <span
                  className={`data flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm ${
                    t.dringend ? "bg-blusrood-vlak text-kastwit" : "bg-antraciet text-kastwit"
                  }`}
                >
                  {t.aantal}
                </span>
                <span className="min-w-0 flex-1 text-sm">{t.tekst}</span>
                <span aria-hidden className="text-staal-tekst">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
