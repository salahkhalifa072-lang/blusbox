import { factuurLijst } from "@/db/facturen";
import { Cel, Leeg, Paneel, Rij, Status, Tabel } from "@/components/dashboard/ui";
import { vereisDashboard } from "@/lib/sessie";
import { magFactureren, vereis } from "@/lib/rollen";
import { catalogus } from "@/lib/catalogus";
import { euro } from "@/lib/pricing";
import { formatteerNl } from "@/lib/levensduur";
import { verzendadres } from "@/lib/bedrijf";
import { mailBeschikbaar } from "@/lib/mail";
import { stripeBeschikbaar } from "@/lib/stripe";
import { datumNl } from "@/lib/factuur";
import { FactuurFormulier } from "./formulier";
import { Opnieuw } from "./opnieuw";

export const dynamic = "force-dynamic";

export default async function FacturenPagina() {
  const actor = await vereisDashboard();
  vereis(magFactureren(actor.rol), "facturen openen");

  const facturen = await factuurLijst(200);

  // Wat er ontbreekt om een factuur te kunnen maken én te laten betalen.
  // Liever hier benoemd dan pas na het invullen van het hele formulier.
  const ontbreekt = [
    !verzendadres() &&
      "vestigingsadres (VERZEND_STRAAT, VERZEND_HUISNUMMER, VERZEND_POSTCODE, VERZEND_PLAATS)",
    !mailBeschikbaar() && "MAILERSEND_API_TOKEN",
    !stripeBeschikbaar() && "STRIPE_SECRET_KEY",
  ].filter(Boolean);

  const vandaag = datumNl();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Facturen</h1>
        <p className="mt-1 max-w-2xl text-sm text-staal-tekst">
          Voor een verkoop aan de balie: de klant heeft de module al en betaalt
          achteraf. De factuur gaat als pdf vanaf info@blusbox.nl, met een
          betaallink (iDEAL, kaart). Zodra er betaald is krijg je een mail en
          staat de factuur hieronder op geleverd.
        </p>
      </div>

      {ontbreekt.length > 0 ? (
        <p role="alert" className="rounded-2xl border border-signaal bg-kastwit p-4 text-sm">
          Nog niet in te stellen vanuit hier, ontbreekt in Vercel:{" "}
          {ontbreekt.join(", ")}.
        </p>
      ) : null}

      <Paneel titel="Nieuwe factuur">
        <FactuurFormulier
          artikelen={catalogus
            .filter((c) => c.actief)
            .map((c) => ({
              slug: c.slug,
              naam: c.naam,
              prijs: ((c.prijsInclBtwCenten ?? c.prijsExclBtwCenten) / 100)
                .toFixed(2)
                .replace(".", ","),
            }))}
          vandaag={vandaag}
        />
      </Paneel>

      <Paneel titel="Verstuurde facturen">
        {facturen.length === 0 ? (
          <Leeg tekst="Nog geen facturen." />
        ) : (
          <Tabel
            koppen={["Factuur", "Status", "Klant", "E-mail", "Totaal", "Datum", "Pdf", ""]}
          >
            {facturen.map((f) => (
              <Rij key={f.factuurnummer}>
                <Cel mono>{f.factuurnummer}</Cel>
                <Cel>
                  {f.status === "nieuw" ? (
                    <span className="data text-xs text-staal-tekst">openstaand</span>
                  ) : (
                    <Status waarde={f.status === "geleverd" ? "betaald" : f.status} />
                  )}
                </Cel>
                <Cel>
                  {[f.bedrijfsnaam, f.klantNaam].filter(Boolean).join(" · ") || "—"}
                </Cel>
                <Cel>{f.email || "—"}</Cel>
                <Cel mono>{euro(f.totaalCenten)}</Cel>
                <Cel mono>
                  {f.gefactureerdOp
                    ? formatteerNl(datumNl(f.gefactureerdOp))
                    : "—"}
                </Cel>
                <Cel>
                  <a
                    href={`/dashboard/facturen/${f.factuurnummer}/pdf`}
                    className="data text-xs underline underline-offset-4"
                  >
                    bekijken
                  </a>
                </Cel>
                <Cel>
                  {f.status === "nieuw" && f.factuurnummer ? (
                    <Opnieuw factuurnummer={f.factuurnummer} />
                  ) : null}
                </Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>
    </div>
  );
}
