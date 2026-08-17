import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/auth";
import { vereisInstallateur } from "@/lib/sessie";
import { beschikbareLots, eigenCijfers, eigenUnits } from "@/db/installateur";
import { Cel, Leeg, Paneel, Rij, Tabel, Tegel } from "@/components/dashboard/ui";
import { LogoMark } from "@/components/site/logo";
import { formatteerNl, verlooptBinnenMaanden } from "@/lib/levensduur";
import { euro, PRIJS_EXCL_CENTEN } from "@/lib/pricing";
import { PlaatsingFormulier } from "./plaatsing-formulier";

export const metadata: Metadata = {
  title: "Installateursportaal",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

function vandaagIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
  }).format(new Date());
}

export default async function PortaalPagina() {
  const actor = await vereisInstallateur();
  const vandaag = vandaagIso();

  const [units, cijfers, lots] = await Promise.all([
    eigenUnits(actor.id),
    eigenCijfers(actor.id, vandaag),
    beschikbareLots(),
  ]);

  async function uitloggen() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen bg-kastwit-dim">
      <header className="border-b border-railstaal/50 bg-antraciet text-kastwit">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link href="/portaal" className="flex items-center gap-2">
            <LogoMark className="h-7 w-auto" />
            <span className="font-display text-lg">Blusbox</span>
            <span className="data ml-1 rounded-full border border-kastwit/25 px-2 py-0.5 text-[10px] uppercase tracking-widest text-railstaal">
              installateur
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="data text-xs text-railstaal">{actor.email}</span>
            <form action={uitloggen}>
              <button
                type="submit"
                className="data rounded-full border border-kastwit/30 px-3 py-1.5 text-xs transition-colors hover:bg-kastwit hover:text-antraciet"
              >
                Uitloggen
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div>
          {/* §2: u-vorm op zakelijke schermen */}
          <h1 className="font-display text-3xl">Uw portaal</h1>
          <p className="mt-1 max-w-2xl text-sm text-staal-tekst">
            Hier legt u vast welke module u waar heeft geplaatst. Daarmee staat
            de vervangdatum vast en krijgt u op tijd bericht dat u kunt
            doorsturen naar uw klant.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Tegel
            label="Geplaatst"
            waarde={String(cijfers.geplaatst)}
            toelichting="Door u geregistreerde units"
          />
          <Tegel
            label="Verloopt binnen 12 mnd"
            waarde={String(cijfers.verlooptBinnenJaar)}
            toelichting="Vervanging bespreken met uw klant"
            nadruk={cijfers.verlooptBinnenJaar > 0}
          />
          <Tegel
            label="Verlopen"
            waarde={String(cijfers.verlopen)}
            toelichting="Beschermen niet meer"
            nadruk={cijfers.verlopen > 0}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Paneel titel="Uw geplaatste units">
            {units.length === 0 ? (
              <Leeg tekst="U heeft nog geen plaatsingen vastgelegd." />
            ) : (
              <Tabel
                koppen={["Lot", "Geplaatst", "Vervalt", "Locatie", "Postcode"]}
              >
                {units.map((u) => (
                  <Rij key={u.id}>
                    <Cel mono>{u.lotNummer}</Cel>
                    <Cel mono>{formatteerNl(u.installatiedatum)}</Cel>
                    <Cel mono>
                      {formatteerNl(u.vervaldatum)}
                      {verlooptBinnenMaanden(u.vervaldatum, vandaag, 12) ? (
                        <span className="data ml-2 rounded-full border border-signaal px-2 py-0.5 text-[10px]">
                          binnen 12 mnd
                        </span>
                      ) : null}
                    </Cel>
                    <Cel>{u.locatieType.replace(/_/g, " ")}</Cel>
                    <Cel mono>{u.postcode ?? "—"}</Cel>
                  </Rij>
                ))}
              </Tabel>
            )}
          </Paneel>

          <Paneel titel="Plaatsing vastleggen">
            <div className="p-5">
              <PlaatsingFormulier lotNummers={lots.map((l) => l.lotNummer)} />
            </div>
          </Paneel>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Paneel titel="Uw inkoopprijs">
            <div className="space-y-3 p-5 text-sm">
              <p className="text-staal-tekst">
                Zakelijke prijzen zijn exclusief btw. In dit scherm tonen wij
                nooit consumentenprijzen ernaast.
              </p>
              <p className="data text-2xl">{euro(PRIJS_EXCL_CENTEN)}</p>
              <p className="text-xs text-staal-tekst">
                Per module, excl. btw. Staffelkorting bij grotere afname:{" "}
                vanaf dertig stuks 5% korting, oplopend met 5% per dertig
                stuks tot maximaal 17,5%. Bestellen op rekening na goedkeuring,
                betaaltermijn dertig dagen.
              </p>
              <Link
                href="/contact"
                className="data inline-block text-xs underline underline-offset-4"
              >
                Bulkbestelling aanvragen
              </Link>
            </div>
          </Paneel>

          <Paneel titel="Materiaal">
            <div className="space-y-3 p-5 text-sm">
              <p className="text-staal-tekst">
                Documentatie voor uw eigen offertes en voor uw monteurs.
              </p>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/downloads"
                    className="underline underline-offset-4"
                  >
                    Handleiding, DoC, SDS en productblad
                  </Link>
                </li>
                <li>
                  <Link
                    href="/installatie"
                    className="underline underline-offset-4"
                  >
                    Montage-instructie en wat te doen na een activering
                  </Link>
                </li>
                <li className="text-staal-tekst">
                  Verkoopmateriaal en trainingsmateriaal: op aanvraag
                </li>
              </ul>
            </div>
          </Paneel>
        </div>
      </main>
    </div>
  );
}
