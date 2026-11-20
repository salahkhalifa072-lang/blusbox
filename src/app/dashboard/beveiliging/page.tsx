import type { Metadata } from "next";
import Link from "next/link";
import { Cel, Leeg, Paneel, Rij, Tabel, Tegel } from "@/components/dashboard/ui";
import { bewakingsoverzicht, huidigIp } from "@/lib/inlogbewaking";
import { GRENZEN } from "@/lib/inlogregels";
import { hefBlokkadeOp } from "./acties";

export const metadata: Metadata = {
  title: "Inlogbewaking",
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

const SOORT: Record<string, string> = {
  wachtwoord: "Fout wachtwoord",
  code: "Foute code",
  herstel: "Herstelmail gevraagd",
};

/**
 * Wat de inlogbewaking ziet en heeft gedaan. Blokkeren gaat vanzelf; hier
 * kun je een blokkade opheffen, bijvoorbeeld als je jezelf hebt
 * buitengesloten met een paar keer een verkeerd wachtwoord.
 */
export default async function InlogbewakingPagina() {
  const [{ blokkades, recent, stats }, mijnIp] = await Promise.all([
    bewakingsoverzicht(),
    huidigIp(),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl max-lg:sr-only sm:text-3xl">Inlogbewaking</h1>
        <p className="mt-2 max-w-prose text-sm text-staal-tekst">
          Elke inlogpoging wordt bekeken. Een adres met {GRENZEN.ipFout.aantal} foute
          pogingen in {GRENZEN.ipFout.minuten} minuten, of foute pogingen op{" "}
          {GRENZEN.ipAdressen.aantal} verschillende e-mailadressen, wordt meteen
          geblokkeerd: een dag, bij herhaling een week, daarna een maand. Een
          account dat vanaf veel adressen tegelijk wordt geprobeerd, pauzeert
          een kwartier. Bij elke nieuwe blokkade krijg je een mail.
        </p>
        <p className="data mt-3 text-xs text-staal-tekst">Jouw adres nu: {mijnIp}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Tegel label="Fout, 24 uur" waarde={String(stats?.fout ?? 0)} nadruk={(stats?.fout ?? 0) >= 10} />
        <Tegel label="Adressen met fouten" waarde={String(stats?.adressen ?? 0)} />
        <Tegel label="Nu geblokkeerd" waarde={String(blokkades.length)} nadruk={blokkades.length > 0} />
      </div>

      <Paneel titel="Geblokkeerde adressen">
        {blokkades.length === 0 ? (
          <Leeg tekst="Er is op dit moment niets geblokkeerd." />
        ) : (
          <Tabel koppen={["Adres", "Reden", "Tot", "Keer", "Actie"]}>
            {blokkades.map((b) => (
              <Rij key={b.ip}>
                <Cel mono eerste>
                  {b.ip}
                  {b.ip === mijnIp ? (
                    <span className="block font-sans text-xs text-blusrood-op-licht">dit ben jij</span>
                  ) : null}
                </Cel>
                <Cel>{b.reden}</Cel>
                <Cel mono>{tijd.format(b.tot)}</Cel>
                <Cel mono>{b.keer}</Cel>
                <Cel>
                  <form action={hefBlokkadeOp}>
                    <input type="hidden" name="ip" value={b.ip} />
                    <button
                      type="submit"
                      className="rounded-full border border-antraciet/30 px-3 py-1.5 text-xs hover:bg-antraciet hover:text-kastwit"
                    >
                      Opheffen
                    </button>
                  </form>
                </Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>

      <Paneel titel="Laatste verdachte pogingen">
        {recent.length === 0 ? (
          <Leeg tekst="Nog geen foute pogingen. Pogingen worden 30 dagen bewaard." />
        ) : (
          <Tabel koppen={["Tijd", "Adres", "E-mailadres", "Soort"]}>
            {recent.map((p) => (
              <Rij key={p.id}>
                <Cel mono eerste>{tijd.format(p.tijd)}</Cel>
                <Cel mono>{p.ip}</Cel>
                <Cel mono>{p.email ?? "—"}</Cel>
                <Cel>{SOORT[p.soort] ?? p.soort}</Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>

      <p className="text-sm text-staal-tekst">
        Je eigen account beveiligen met een code uit een app:{" "}
        <Link href="/account/beveiliging" className="underline underline-offset-4">
          tweestapsverificatie
        </Link>
        .
      </p>
    </div>
  );
}
