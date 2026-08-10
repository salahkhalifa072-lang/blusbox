import Link from "next/link";
import { overzichtCijfers, bestellingenLijst } from "@/db/dashboard";
import { Cel, Leeg, Paneel, Rij, Status, Tabel, Tegel } from "@/components/dashboard/ui";
import { euro } from "@/lib/pricing";
import { formatteerNl } from "@/lib/levensduur";

export const dynamic = "force-dynamic";

function vandaagIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
  }).format(new Date());
}

export default async function DashboardOverzicht() {
  const vandaag = vandaagIso();
  const [cijfers, recent] = await Promise.all([
    overzichtCijfers(vandaag),
    bestellingenLijst(8),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Overzicht</h1>
        <p className="data mt-1 text-xs text-staal-tekst">
          {formatteerNl(vandaag)} · Europe/Amsterdam
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tegel
          label="Omzet"
          waarde={euro(cijfers.omzetCenten)}
          toelichting="Betaalde bestellingen, incl. btw"
        />
        <Tegel
          label="Bestellingen"
          waarde={String(cijfers.aantalOrders)}
          toelichting={`Gemiddeld ${euro(cijfers.aovCenten)} per bestelling`}
        />
        <Tegel
          label="Geplaatste units"
          waarde={String(cijfers.geregistreerdeUnits)}
          toelichting="Geregistreerd met installatiedatum"
        />
        <Tegel
          label="Verloopt binnen 12 mnd"
          waarde={String(cijfers.verlooptBinnenJaar)}
          toelichting="Vervangingsherinnering nodig"
          nadruk={cijfers.verlooptBinnenJaar > 0}
        />
        <Tegel
          label="Open retouren"
          waarde={String(cijfers.openRetouren)}
          toelichting="Aangemeld, goedgekeurd of ontvangen"
          nadruk={cijfers.openRetouren > 0}
        />
        <Tegel
          label="Open recalls"
          waarde={String(cijfers.openRecalls)}
          toelichting="Nog niet afgesloten"
          nadruk={cijfers.openRecalls > 0}
        />
        <Tegel
          label="Activeringen"
          waarde={String(cijfers.activeringen)}
          toelichting="Gemelde inzetten in het veld"
        />
        <Tegel
          label="Conversie"
          waarde="[VERIFY]"
          toelichting="Vereist bezoekersstatistiek (stap 11)"
        />
      </div>

      <Paneel
        titel="Laatste bestellingen"
        actie={
          <Link
            href="/dashboard/bestellingen"
            className="data text-xs underline underline-offset-4"
          >
            Alle bestellingen
          </Link>
        }
      >
        {recent.length === 0 ? (
          <Leeg tekst="Nog geen bestellingen." />
        ) : (
          <Tabel koppen={["Bestelnummer", "Status", "E-mail", "Totaal", "Geplaatst"]}>
            {recent.map((b) => (
              <Rij key={b.id}>
                <Cel mono>{b.ordernummer}</Cel>
                <Cel>
                  <Status waarde={b.status} />
                </Cel>
                <Cel>{b.email || "—"}</Cel>
                <Cel mono>{euro(b.totaalCenten)}</Cel>
                <Cel mono>
                  {formatteerNl(b.geplaatstOp.toISOString().slice(0, 10))}
                </Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>
    </div>
  );
}
