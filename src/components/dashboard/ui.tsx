import type { ReactNode } from "react";

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
      className={`rounded-2xl border bg-kastwit p-5 ${
        nadruk ? "border-signaal" : "border-railstaal/50"
      }`}
    >
      <p className="data text-[11px] uppercase tracking-widest text-staal-tekst">
        {label}
      </p>
      <p className="data mt-2 text-2xl">{waarde}</p>
      {toelichting ? (
        <p className="mt-1 text-xs leading-snug text-staal-tekst">
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-railstaal/50 px-5 py-4">
        <h2 className="font-display text-xl">{titel}</h2>
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
        className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-antraciet"
      >
        {children}
      </div>
    </section>
  );
}

export function Tabel({
  koppen,
  children,
}: {
  koppen: string[];
  children: ReactNode;
}) {
  return (
    <table className="w-full min-w-[42rem] border-collapse text-sm">
      <thead>
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
      <tbody>{children}</tbody>
    </table>
  );
}

export function Rij({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-railstaal/25 last:border-0">{children}</tr>
  );
}

export function Cel({
  children,
  mono = false,
}: {
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <td className={`px-5 py-3 align-top ${mono ? "data" : ""}`}>{children}</td>
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
  return <p className="px-5 py-8 text-sm text-staal-tekst">{tekst}</p>;
}
