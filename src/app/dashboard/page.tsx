import Link from "next/link";
import { overzichtCijfers, bestellingenLijst, teDoen } from "@/db/dashboard";
import { Cel, Leeg, Paneel, Rij, Status, Tabel, TeDoen, Tegel } from "@/components/dashboard/ui";
import { openContactberichten } from "@/db/contact";
import { cookievraagPerDag, toestemmingOverzicht } from "@/db/toestemming";
import { vereisDashboard } from "@/lib/sessie";
import { magFactureren } from "@/lib/rollen";
import { euro } from "@/lib/pricing";
import { formatteerNl } from "@/lib/levensduur";
import { metingActief } from "@/lib/meting";

export const dynamic = "force-dynamic";

function vandaagIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
  }).format(new Date());
}

export default async function DashboardOverzicht() {
  const vandaag = vandaagIso();
  const [actor, cijfers, recent, taken] = await Promise.all([
    vereisDashboard(),
    overzichtCijfers(vandaag),
    bestellingenLijst(8),
    teDoen(),
  ]);
  const [berichten, cookies, cookievraag] = await Promise.all([
    openContactberichten(),
    toestemmingOverzicht(30),
    metingActief ? cookievraagPerDag(14) : Promise.resolve([]),
  ]);

  const enkelvoud = (n: number, een: string, meer: string) => (n === 1 ? een : meer);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl max-lg:sr-only sm:text-3xl">Overzicht</h1>
        <p className="data mt-1 text-xs text-staal-tekst">
          {formatteerNl(vandaag)} · Europe/Amsterdam
        </p>
      </div>

      <TeDoen
        taken={[
          {
            aantal: taken.versturen,
            tekst: `${enkelvoud(taken.versturen, "bestelling", "bestellingen")} betaald en klaar om te versturen`,
            href: "/dashboard/bestellingen?filter=versturen",
            dringend: true,
          },
          {
            aantal: berichten,
            tekst: `${enkelvoud(berichten, "bericht", "berichten")} via het contactformulier, nog niet beantwoord`,
            href: "/dashboard/berichten",
            dringend: true,
          },
          {
            aantal: taken.retourBeoordelen,
            tekst: `${enkelvoud(taken.retourBeoordelen, "retour", "retouren")} aangemeld, wacht op je besluit`,
            href: "/dashboard/retouren",
          },
          {
            aantal: taken.retourTerugbetalen,
            tekst: `${enkelvoud(taken.retourTerugbetalen, "retour", "retouren")} ontvangen, nog terugbetalen`,
            href: "/dashboard/retouren",
          },
          {
            aantal: taken.affiliateAanvragen,
            tekst: `affiliate-${enkelvoud(taken.affiliateAanvragen, "aanvraag", "aanvragen")} om te beoordelen`,
            href: "/dashboard/affiliates",
          },
          {
            aantal: taken.openRecalls,
            tekst: `${enkelvoud(taken.openRecalls, "recall", "recalls")} nog niet afgesloten`,
            href: "/dashboard/recalls",
            dringend: true,
          },
          ...(magFactureren(actor.rol)
            ? [
                {
                  aantal: taken.openFacturen,
                  tekst: `${enkelvoud(taken.openFacturen, "factuur", "facturen")} nog niet betaald`,
                  href: "/dashboard/facturen",
                },
              ]
            : []),
          {
            aantal: taken.onderwegLang,
            tekst: `${enkelvoud(taken.onderwegLang, "zending", "zendingen")} al ruim 5 dagen onderweg — op geleverd zetten?`,
            href: "/dashboard/bestellingen?filter=onderweg",
          },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
          label="Cookie-akkoord"
          waarde={cookies.procentAkkoord === null ? "—" : `${cookies.procentAkkoord}%`}
          toelichting={
            cookies.totaal === 0
              ? "Nog geen keuzes geteld"
              : `${cookies.verleend} akkoord, ${cookies.geweigerd} geweigerd · 30 dagen`
          }
        />
        <Tegel
          label="Activeringen"
          waarde={String(cijfers.activeringen)}
          toelichting="Gemelde inzetten in het veld"
        />
        {/*
          Deze tegel vertelt waaróm er geen cijfer staat. Zodra er wél
          gemeten wordt staat het cijfer bij Google en niet hier, en dan
          moet er iets anders staan dan "wij meten niet" — anders wijst het
          dashboard je de verkeerde kant op als je je afvraagt waar je
          conversie blijft.
        */}
        <Tegel
          label="Conversie"
          waarde="—"
          toelichting={
            metingActief
              ? "Staat in Google Ads en Analytics, niet hier"
              : "Er staat geen bezoekersstatistiek op de site"
          }
        />
      </div>

      {metingActief && (
        <Paneel titel="Cookievraag per dag">
          {cookievraag.length === 0 ? (
            <Leeg tekst="Nog niets geteld in de afgelopen 14 dagen." />
          ) : (
            <Tabel koppen={["Dag", "Getoond", "Akkoord", "Weigeren", "Weg zonder keuze"]}>
              {cookievraag.map((d) => (
                <Rij key={d.dag}>
                  <Cel mono>{formatteerNl(d.dag)}</Cel>
                  <Cel mono>{d.getoond > 0 ? d.getoond : "—"}</Cel>
                  <Cel mono>{d.verleend}</Cel>
                  <Cel mono>{d.geweigerd}</Cel>
                  <Cel mono>{d.zonderKeuze === null ? "—" : d.zonderKeuze}</Cel>
                </Rij>
              ))}
            </Tabel>
          )}
        </Paneel>
      )}

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
