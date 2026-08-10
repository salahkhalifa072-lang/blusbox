import { unitsLijst } from "@/db/dashboard";
import { Cel, Leeg, Paneel, Rij, Tabel } from "@/components/dashboard/ui";
import { formatteerNl, verlooptBinnenMaanden } from "@/lib/levensduur";

export const dynamic = "force-dynamic";

function vandaagIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
  }).format(new Date());
}

export default async function UnitsPagina() {
  const vandaag = vandaagIso();
  const units = await unitsLijst(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Geplaatste units</h1>
        <p className="mt-1 max-w-2xl text-sm text-staal-tekst">
          Installatiedatum plus tien jaar bepaalt de vervangdatum. Herinneringen
          gaan uit op twaalf, zes en één maand voor het einde.
        </p>
      </div>

      <Paneel titel="Register">
        {units.length === 0 ? (
          <Leeg tekst="Nog geen units geregistreerd." />
        ) : (
          <Tabel
            koppen={[
              "Lot",
              "Geïnstalleerd",
              "Vervalt",
              "Locatie",
              "Postcode",
              "Herinneringen",
            ]}
          >
            {units.map((u) => {
              const bijnaVerlopen = verlooptBinnenMaanden(
                u.vervaldatum,
                vandaag,
                12,
              );
              return (
                <Rij key={u.id}>
                  <Cel mono>{u.lotNummer}</Cel>
                  <Cel mono>{formatteerNl(u.installatiedatum)}</Cel>
                  <Cel mono>
                    {formatteerNl(u.vervaldatum)}
                    {bijnaVerlopen ? (
                      <span className="data ml-2 rounded-full border border-signaal px-2 py-0.5 text-[10px]">
                        binnen 12 mnd
                      </span>
                    ) : null}
                  </Cel>
                  <Cel>{u.locatieType.replace(/_/g, " ")}</Cel>
                  <Cel mono>{u.postcode ?? "—"}</Cel>
                  <Cel mono>
                    {[
                      u.herinnering12Op ? "12" : null,
                      u.herinnering6Op ? "6" : null,
                      u.herinnering1Op ? "1" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </Cel>
                </Rij>
              );
            })}
          </Tabel>
        )}
      </Paneel>
    </div>
  );
}
