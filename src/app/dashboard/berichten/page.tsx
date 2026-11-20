import type { Metadata } from "next";
import Link from "next/link";
import { Leeg, Paneel } from "@/components/dashboard/ui";
import { contactAantallen, contactberichtenLijst, type ContactStatus } from "@/db/contact";

export const metadata: Metadata = {
  title: "Berichten",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const tijd = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});

const TABS: { status: ContactStatus; label: string }[] = [
  { status: "nieuw", label: "Open" },
  { status: "beantwoord", label: "Beantwoord" },
  { status: "gearchiveerd", label: "Archief" },
];

/** Berichten via het contactformulier, nieuwste bovenaan. */
export default async function BerichtenPagina({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: gekozen } = await searchParams;
  const status = (TABS.find((t) => t.status === gekozen)?.status ?? "nieuw") as ContactStatus;
  const [berichten, aantallen] = await Promise.all([
    contactberichtenLijst(status),
    contactAantallen(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl max-lg:sr-only sm:text-3xl">Berichten</h1>
          <p className="mt-2 max-w-prose text-sm text-staal-tekst">
            Vragen via het contactformulier. Je antwoord gaat vanaf
            info@blusbox.nl; reageert de klant daarop, dan komt dat in die mailbox.
          </p>
        </div>
        <Link
          href="/dashboard/berichten/nieuw"
          className="rounded-full border border-antraciet/30 px-4 py-2 text-sm hover:bg-antraciet hover:text-kastwit"
        >
          Bericht uit je mail toevoegen
        </Link>
      </div>

      <nav aria-label="Status" className="flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t.status}
            href={t.status === "nieuw" ? "/dashboard/berichten" : `/dashboard/berichten?status=${t.status}`}
            aria-current={t.status === status ? "page" : undefined}
            className={`data rounded-full px-4 py-2 text-xs ${
              t.status === status ? "bg-antraciet text-kastwit" : "border border-antraciet/20 hover:bg-kastwit"
            }`}
          >
            {t.label} ({aantallen[t.status]})
          </Link>
        ))}
      </nav>

      <Paneel titel={TABS.find((t) => t.status === status)!.label}>
        {berichten.length === 0 ? (
          <Leeg
            tekst={
              status === "nieuw"
                ? "Geen openstaande berichten. Nieuwe berichten via het contactformulier verschijnen hier."
                : "Hier staat nog niets."
            }
          />
        ) : (
          <ul className="divide-y divide-railstaal/40">
            {berichten.map((b) => {
              const ongelezen = b.status === "nieuw" && !b.gelezenOp;
              return (
                <li key={b.id}>
                  <Link
                    href={`/dashboard/berichten/${b.id}`}
                    className="flex gap-4 px-4 py-4 transition-colors hover:bg-kastwit-dim sm:px-5"
                  >
                    <span
                      aria-hidden
                      className={`mt-2 h-2 w-2 shrink-0 rounded-full ${ongelezen ? "bg-blusrood-vlak" : "bg-transparent"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <span className={ongelezen ? "font-semibold" : ""}>
                          {b.naam}
                          {ongelezen ? <span className="sr-only"> (ongelezen)</span> : null}
                        </span>
                        <span className="data text-xs text-staal-tekst">{tijd.format(b.ontvangenOp)}</span>
                      </span>
                      <span className="block text-sm">{b.onderwerp}</span>
                      <span className="block truncate text-sm text-staal-tekst">{b.bericht}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Paneel>
    </div>
  );
}
