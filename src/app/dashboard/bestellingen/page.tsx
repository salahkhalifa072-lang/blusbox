import Link from "next/link";
import {
  BESTELFILTERS,
  bestelfilterAantallen,
  bestellingenLijst,
  herkomstOverzicht,
  isBestelfilter,
  type Bestelfilter,
} from "@/db/dashboard";
import { Cel, Leeg, Paneel, Rij, Status, Tabel } from "@/components/dashboard/ui";
import { euro } from "@/lib/pricing";
import { formatteerNl } from "@/lib/levensduur";
import { herkomstTekst, type Herkomst } from "@/lib/herkomst";
import { Afhandelen } from "./afhandelen";
import { Bericht } from "./bericht";

export const dynamic = "force-dynamic";

/*
 * Zoeken en filteren lopen via de URL (?zoek=…&filter=…). Daardoor werkt
 * het zonder JavaScript, kun je een gefilterde lijst als bladwijzer
 * bewaren, en kan het overzicht direct naar "te versturen" linken.
 */
function link(filter: Bestelfilter, zoek: string): string {
  const p = new URLSearchParams();
  if (filter !== "alle") p.set("filter", filter);
  if (zoek) p.set("zoek", zoek);
  const q = p.toString();
  return q ? `/dashboard/bestellingen?${q}` : "/dashboard/bestellingen";
}

export default async function BestellingenPagina({
  searchParams,
}: {
  searchParams: Promise<{ zoek?: string | string[]; filter?: string | string[] }>;
}) {
  const sp = await searchParams;
  const zoek = (Array.isArray(sp.zoek) ? sp.zoek[0] : sp.zoek)?.trim().slice(0, 80) ?? "";
  const ruwFilter = Array.isArray(sp.filter) ? sp.filter[0] : sp.filter;
  const filter: Bestelfilter = isBestelfilter(ruwFilter) ? ruwFilter : "alle";

  const [bestellingen, aantallen, herkomsten] = await Promise.all([
    bestellingenLijst(200, { zoek, filter }),
    bestelfilterAantallen(),
    herkomstOverzicht(90),
  ]);

  const filters = Object.keys(BESTELFILTERS) as Bestelfilter[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl max-lg:sr-only sm:text-3xl">Bestellingen</h1>
        <p className="mt-1 max-w-2xl text-sm text-staal-tekst">
          Op geleverd zetten start de bedenktijd van veertien dagen; de klant
          krijgt dan per mail de einddatum.
        </p>
      </div>

      <form role="search" action="/dashboard/bestellingen" className="flex gap-2">
        {filter !== "alle" ? <input type="hidden" name="filter" value={filter} /> : null}
        <label htmlFor="zoek-bestelling" className="sr-only">
          Zoek op bestelnummer, naam, e-mail of postcode
        </label>
        <input
          id="zoek-bestelling"
          name="zoek"
          type="search"
          defaultValue={zoek}
          placeholder="Nummer, naam, e-mail of postcode"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-full border border-railstaal bg-kastwit px-4 py-2.5 text-sm"
        />
        <button
          type="submit"
          className="rounded-full bg-antraciet px-5 py-2.5 text-sm text-kastwit transition-opacity hover:opacity-85"
        >
          Zoek
        </button>
      </form>

      {/* Op een telefoon schuift deze rij zijwaarts in plaats van te
          wrappen: zes knoppen over drie regels duwen de lijst onder de vouw. */}
      <nav aria-label="Filter op status" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
          {filters.map((f) => {
            const aan = f === filter;
            const n = aantallen[f];
            return (
              <li key={f}>
                <Link
                  href={link(f, zoek)}
                  aria-current={aan ? "page" : undefined}
                  className={`data flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                    aan
                      ? "border-antraciet bg-antraciet text-kastwit"
                      : "border-railstaal bg-kastwit text-antraciet hover:border-antraciet"
                  }`}
                >
                  {BESTELFILTERS[f].label}
                  <span
                    className={`rounded-full px-1.5 text-[10px] ${
                      aan
                        ? "bg-kastwit/20"
                        : f === "versturen" && n > 0
                          ? "bg-blusrood-vlak text-kastwit"
                          : "bg-kastwit-dim"
                    }`}
                  >
                    {n}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {filter === "alle" && !zoek ? <HerkomstPaneel rijen={herkomsten} /> : null}

      <Paneel
        titel={
          zoek
            ? `${bestellingen.length} ${bestellingen.length === 1 ? "resultaat" : "resultaten"} voor “${zoek}”`
            : BESTELFILTERS[filter].label
        }
        actie={
          zoek || filter !== "alle" ? (
            <Link href="/dashboard/bestellingen" className="data text-xs underline underline-offset-4">
              Wis filters
            </Link>
          ) : undefined
        }
      >
        {bestellingen.length === 0 ? (
          <Leeg
            tekst={
              zoek
                ? "Niets gevonden. Probeer een deel van het bestelnummer, de achternaam of de postcode."
                : filter === "versturen"
                  ? "Niets te versturen. Alles wat betaald is, is de deur uit."
                  : "Geen bestellingen in deze lijst."
            }
          />
        ) : (
          <Tabel
            koppen={[
              "Bestelnummer",
              "Status",
              "Klant",
              "E-mail",
              "Bezorging",
              "Totaal",
              "Herkomst",
              "Geplaatst",
              "Afhandeling",
              "Bericht",
            ]}
          >
            {bestellingen.map((b) => (
              <Rij key={b.id}>
                <Cel mono>{b.ordernummer}</Cel>
                <Cel>
                  <Status waarde={b.status} />
                </Cel>
                <Cel>{b.klantNaam || "—"}</Cel>
                <Cel>{b.email || "—"}</Cel>
                <Cel mono>
                  {[b.postcode, b.landcode].filter(Boolean).join(" · ") || "—"}
                </Cel>
                <Cel mono>{euro(b.totaalCenten)}</Cel>
                <Cel>
                  <HerkomstCel
                    herkomst={b.herkomst}
                    balie={b.balieverkoop}
                    deur={b.deurverkoop}
                  />
                </Cel>
                <Cel mono>
                  {formatteerNl(b.geplaatstOp.toISOString().slice(0, 10))}
                </Cel>
                <Cel>
                  <Afhandelen
                    ordernummer={b.ordernummer}
                    status={b.status}
                    verzonden={b.verzondenOp !== null}
                    geleverd={b.geleverdOp !== null}
                    balieverkoop={b.balieverkoop}
                  />
                </Cel>
                <Cel>
                  <Bericht ordernummer={b.ordernummer} email={b.email} />
                </Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>
    </div>
  );
}

function HerkomstCel({
  herkomst,
  balie,
  deur,
}: {
  herkomst: Herkomst | null;
  balie: boolean;
  deur: boolean;
}) {
  if (deur) return <span className="text-staal-tekst">Deurverkoop</span>;
  if (balie) return <span className="text-staal-tekst">Balie</span>;
  if (!herkomst) return <span className="text-staal-tekst">—</span>;
  const details = [
    herkomst.campagne ? `campagne ${herkomst.campagne}` : null,
    herkomst.verwijzer ? `via ${herkomst.verwijzer}` : null,
    herkomst.landing ? `binnen op ${herkomst.landing}` : null,
  ].filter(Boolean);
  return (
    <span className="block">
      <span className="whitespace-nowrap">{herkomstTekst(herkomst)}</span>
      {details.length ? (
        <span className="data block text-[11px] text-staal-tekst">{details.join(" · ")}</span>
      ) : null}
    </span>
  );
}

function HerkomstPaneel({
  rijen,
}: {
  rijen: { naam: string; aantal: number; omzetCenten: number }[];
}) {
  const totaal = rijen.reduce((n, r) => n + r.aantal, 0);
  return (
    <Paneel titel="Waar betaalde bestellingen vandaan kwamen · laatste 90 dagen">
      {totaal === 0 ? (
        <Leeg tekst="Nog geen betaalde webshopbestellingen in deze periode." />
      ) : (
        <ul className="divide-y divide-railstaal/50">
          {rijen.map((r) => (
            <li key={r.naam} className="flex items-center gap-3 px-4 py-2.5 text-sm sm:px-5">
              <span className="min-w-0 flex-1 truncate">{r.naam}</span>
              <span
                className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-kastwit-dim sm:block"
                aria-hidden
              >
                <span
                  className="block h-full rounded-full bg-antraciet"
                  style={{ width: `${Math.round((r.aantal / totaal) * 100)}%` }}
                />
              </span>
              <span className="data w-10 text-right">{r.aantal}</span>
              <span className="data w-20 text-right text-staal-tekst">{euro(r.omzetCenten)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="border-t border-railstaal/50 px-4 py-3 text-xs text-staal-tekst sm:px-5">
        Herkomst wordt bijgehouden vanaf 20 november 2026; oudere bestellingen
        staan onder &ldquo;Onbekend&rdquo;. Balie- en deurverkoop tellen niet mee.
      </p>
    </Paneel>
  );
}
