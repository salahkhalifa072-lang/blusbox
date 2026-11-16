import Link from "next/link";
import { vereisVerkoper } from "@/lib/sessie";
import { deurverkopen } from "@/db/deurverkoop";
import { euro } from "@/lib/pricing";
import { DEUR_ARTIKELEN, MAX_DEURKORTING_PROCENT } from "./artikelen";
import { VerkoopFormulier } from "./formulier";

const STATUS: Record<string, { tekst: string; kleur: string }> = {
  nieuw: { tekst: "Wacht op betaling", kleur: "bg-signaal/25 text-antraciet" },
  geleverd: { tekst: "Betaald", kleur: "bg-[#4f9e78]/20 text-[#2c6b4d]" },
  geannuleerd: { tekst: "Geannuleerd", kleur: "bg-railstaal/30 text-staal-tekst" },
  terugbetaald: { tekst: "Terugbetaald", kleur: "bg-railstaal/30 text-staal-tekst" },
};

export default async function VerkoopPagina() {
  const actor = await vereisVerkoper();
  const lijst = await deurverkopen(actor, 20);
  const vandaag = new Date().toDateString();
  const omzetVandaag = lijst
    .filter((r) => r.status === "geleverd" && r.geplaatstOp.toDateString() === vandaag)
    .reduce((t, r) => t + r.totaalCenten, 0);

  return (
    <>
      <h1 className="font-display text-3xl">Nieuwe verkoop</h1>
      <p className="mt-1 text-sm text-staal-tekst">
        Vul de klant in, dan staat de betaling klaar. De klant betaalt met de QR-code op zijn eigen
        telefoon (iDEAL, Apple Pay of kaart) en krijgt de factuur meteen per mail.
      </p>

      <div className="mt-5">
        <VerkoopFormulier
          artikelen={DEUR_ARTIKELEN.map((a) => ({ slug: a.slug, naam: a.naam, prijs: euro(a.prijsInclBtwCenten), prijsCenten: a.prijsInclBtwCenten }))}
          maxProcent={actor.rol === "admin" ? null : MAX_DEURKORTING_PROCENT}
        />
      </div>

      <section className="mt-10" aria-labelledby="recent">
        <div className="flex items-baseline justify-between">
          <h2 id="recent" className="font-display text-xl">Mijn verkopen</h2>
          <p className="data text-xs text-staal-tekst">vandaag {euro(omzetVandaag)}</p>
        </div>
        {lijst.length === 0 ? (
          <p className="mt-3 text-sm text-staal-tekst">Nog geen verkopen.</p>
        ) : (
          <ul className="mt-3 divide-y divide-railstaal/40 overflow-hidden rounded-3xl bg-kastwit">
            {lijst.map((r) => {
              const s = STATUS[r.status] ?? { tekst: r.status, kleur: "bg-railstaal/30" };
              return (
                <li key={r.ordernummer}>
                  <Link href={`/verkoop/${r.ordernummer}`} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{r.klantNaam}</span>
                      <span className="data block truncate text-[11px] text-staal-tekst">
                        {r.factuurnummer ?? r.ordernummer} · {r.plaats} ·{" "}
                        {r.geplaatstOp.toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" })}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="data text-sm">{euro(r.totaalCenten)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${s.kleur}`}>{s.tekst}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
