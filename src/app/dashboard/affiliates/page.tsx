import { Cel, Leeg, Paneel, Rij, Tabel, Tegel } from "@/components/dashboard/ui";
import {
  AanvraagKnoppen,
  AffiliateWijzigen,
  CommissieCorrectie,
  Instellingenformulier,
  RijpeGoedkeuren,
  UitbetalingAfboeken,
  UitbetalingMaken,
} from "@/components/affiliate/beheerformulieren";
import {
  alleAffiliates,
  auditlogRegels,
  commissiesVoorBeheer,
  haalInstellingen,
  uitbetaalbaarPerAffiliate,
  uitbetalingenVoorBeheer,
  verdachteSignalen,
} from "@/db/affiliate";
import { euro } from "@/lib/pricing";
import { formatteerNl } from "@/lib/levensduur";

export const dynamic = "force-dynamic";

/**
 * Beheer van het affiliateprogramma.
 *
 * Eén pagina in plaats van vijf tabbladen: bij een programma van deze
 * omvang is scrollen sneller dan klikken, en zie je in één blik of er iets
 * wacht. Zodra dit honderden affiliates worden hoort het uit elkaar te
 * vallen — dan is filteren belangrijker dan overzicht.
 *
 * De rolcontrole zit in de server actions zelf, niet alleen hier. Deze
 * pagina staat onder /dashboard en erft de bescherming daarvan, maar een
 * server action is een eigen ingang die je los kunt aanroepen.
 */

const datum = (d: Date | null) =>
  d ? formatteerNl(d.toISOString().slice(0, 10)) : "—";

export default async function AffiliateBeheerPagina() {
  const [instellingen, affiliates, commissies, uitbetaalbaar, uitbetalingen, audit, signalen] =
    await Promise.all([
      haalInstellingen(),
      alleAffiliates(),
      commissiesVoorBeheer(),
      uitbetaalbaarPerAffiliate(),
      uitbetalingenVoorBeheer(),
      auditlogRegels(50),
      verdachteSignalen(),
    ]);

  const aanvragen = affiliates.filter((a) => a.status === "aangevraagd");
  const rest = affiliates.filter((a) => a.status !== "aangevraagd");

  const open = commissies.filter((c) => c.status === "open");
  const totaalOpen = open.reduce((s, c) => s + c.bedragCenten, 0);
  const totaalGoedgekeurd = commissies
    .filter((c) => c.status === "goedgekeurd")
    .reduce((s, c) => s + c.bedragCenten, 0);
  const totaalUitbetaald = commissies
    .filter((c) => c.status === "uitbetaald")
    .reduce((s, c) => s + c.bedragCenten, 0);

  const percentageTekst = (bp: number) =>
    (bp / 100).toString().replace(".", ",");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Affiliates</h1>
        <p className="mt-1 max-w-2xl text-sm text-staal-tekst">
          {affiliates.length} deelnemer(s), {commissies.length} commissieregel(s).
          Commissie wordt berekend over de productwaarde na korting, zonder btw
          en zonder verzendkosten.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tegel label="Open aanvragen" waarde={String(aanvragen.length)} />
        <Tegel label="Open commissie" waarde={euro(totaalOpen)} />
        <Tegel label="Goedgekeurd" waarde={euro(totaalGoedgekeurd)} />
        <Tegel label="Uitbetaald" waarde={euro(totaalUitbetaald)} />
      </div>

      {/* Aanvragen */}
      <Paneel titel="Nieuwe aanvragen">
        {aanvragen.length === 0 ? (
          <Leeg tekst="Geen openstaande aanvragen." />
        ) : (
          <Tabel koppen={["Aangemeld", "Naam", "E-mail", "Link", "Land", "Besluit"]}>
            {aanvragen.map((a) => (
              <Rij key={a.id}>
                <Cel mono>{datum(a.aangemaaktOp)}</Cel>
                <Cel>
                  {a.naam ?? "—"}
                  {a.bedrijfsnaam && (
                    <span className="block text-xs text-staal-tekst">
                      {a.bedrijfsnaam}
                    </span>
                  )}
                </Cel>
                <Cel>{a.email}</Cel>
                <Cel mono>/r/{a.slug}</Cel>
                <Cel mono>{a.landcode}</Cel>
                <Cel>
                  <AanvraagKnoppen
                    affiliateId={a.id}
                    slug={a.slug}
                    status={a.status}
                  />
                </Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>

      {/* Deelnemers */}
      <Paneel titel="Deelnemers">
        {rest.length === 0 ? (
          <Leeg tekst="Nog geen goedgekeurde affiliates." />
        ) : (
          <Tabel koppen={["Status", "Naam", "Link en percentage", "Beheer"]}>
            {rest.map((a) => (
              <Rij key={a.id}>
                <Cel mono>{a.status}</Cel>
                <Cel>
                  {a.naam ?? "—"}
                  <span className="block text-xs text-staal-tekst">{a.email}</span>
                </Cel>
                <Cel>
                  <AffiliateWijzigen
                    affiliateId={a.id}
                    slug={a.slug}
                    percentage={
                      a.percentageBp !== null
                        ? percentageTekst(a.percentageBp)
                        : ""
                    }
                  />
                  {a.percentageBp === null && (
                    <span className="data mt-1 block text-[11px] text-staal-tekst">
                      volgt standaard ({percentageTekst(instellingen.standaardPercentageBp)}%)
                    </span>
                  )}
                </Cel>
                <Cel>
                  <AanvraagKnoppen
                    affiliateId={a.id}
                    slug={a.slug}
                    status={a.status}
                  />
                </Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>

      {/* Commissies */}
      <Paneel titel="Commissies">
        <div className="mb-4">
          <RijpeGoedkeuren />
          <p className="data mt-2 text-xs text-staal-tekst">
            Zet commissies waarvan de bedenktijd van veertien dagen voorbij is
            op goedgekeurd. Draai dit bijvoorbeeld wekelijks.
          </p>
        </div>

        {commissies.length === 0 ? (
          <Leeg tekst="Nog geen commissies." />
        ) : (
          <Tabel
            koppen={[
              "Besteld",
              "Bestelnummer",
              "Affiliate",
              "Omzet",
              "%",
              "Commissie",
              "Status",
              "Rijp op",
              "Correctie",
            ]}
          >
            {commissies.map((c) => (
              <Rij key={c.id}>
                <Cel mono>{datum(c.besteldOp)}</Cel>
                <Cel mono>{c.ordernummer}</Cel>
                <Cel>
                  {c.affiliateNaam ?? c.affiliateSlug}
                  <span className="block text-xs text-staal-tekst">
                    /r/{c.affiliateSlug}
                  </span>
                </Cel>
                <Cel mono>{euro(c.grondslagCenten)}</Cel>
                <Cel mono>{percentageTekst(c.percentageBp)}</Cel>
                <Cel mono>{euro(c.bedragCenten)}</Cel>
                <Cel mono>
                  {c.status}
                  {c.reden && (
                    <span className="block text-[11px] text-staal-tekst">
                      {c.reden}
                    </span>
                  )}
                </Cel>
                <Cel mono>{datum(c.rijpOp)}</Cel>
                <Cel>
                  <CommissieCorrectie commissieId={c.id} status={c.status} />
                </Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>

      {/* Uitbetalen */}
      <Paneel titel="Klaar om uit te betalen">
        {uitbetaalbaar.length === 0 ? (
          <Leeg tekst="Er staat niets goedgekeurd open." />
        ) : (
          <Tabel koppen={["Affiliate", "Regels", "Bedrag", "Rekening", "Actie"]}>
            {uitbetaalbaar.map((u) => (
              <Rij key={u.affiliateId}>
                <Cel>
                  {u.naam ?? u.slug}
                  <span className="block text-xs text-staal-tekst">{u.email}</span>
                </Cel>
                <Cel mono>{u.aantal}</Cel>
                <Cel mono>{euro(u.bedragCenten)}</Cel>
                <Cel mono>{u.uitbetaalRekening ?? "niet opgegeven"}</Cel>
                <Cel>
                  <UitbetalingMaken
                    affiliateId={u.affiliateId}
                    slug={u.slug}
                    bedrag={euro(u.bedragCenten)}
                  />
                </Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>

      <Paneel titel="Uitbetalingen">
        {uitbetalingen.length === 0 ? (
          <Leeg tekst="Nog geen uitbetalingen." />
        ) : (
          <Tabel
            koppen={["Aangemaakt", "Affiliate", "Bedrag", "Status", "Kenmerk", "Actie"]}
          >
            {uitbetalingen.map((u) => (
              <Rij key={u.id}>
                <Cel mono>{datum(u.aangemaaktOp)}</Cel>
                <Cel>{u.naam ?? u.slug}</Cel>
                <Cel mono>{euro(u.bedragCenten)}</Cel>
                <Cel mono>{u.status}</Cel>
                <Cel mono>{u.referentie ?? "—"}</Cel>
                <Cel>
                  {u.status === "concept" ? (
                    <UitbetalingAfboeken
                      uitbetalingId={u.id}
                      bedrag={euro(u.bedragCenten)}
                    />
                  ) : (
                    <span className="data text-xs text-staal-tekst">
                      {datum(u.uitbetaaldOp)}
                    </span>
                  )}
                </Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>

      {/* Signalen */}
      <Paneel titel="Wat opvalt">
        {signalen.veelKlikkenEenBron.length === 0 &&
        signalen.nulConversie.length === 0 ? (
          <Leeg tekst="Niets bijzonders in de afgelopen periode." />
        ) : (
          <ul className="space-y-2 text-sm">
            {signalen.veelKlikkenEenBron.map((s, i) => (
              <li key={`bron-${i}`}>
                <span className="data">/r/{s.slug}</span> — {s.aantal} klikken van
                dezelfde bron in zeven dagen.
              </li>
            ))}
            {signalen.nulConversie.map((s, i) => (
              <li key={`conv-${i}`}>
                <span className="data">/r/{s.slug}</span> — {s.klikken} klikken in
                dertig dagen; controleer of daar verkopen tegenover staan.
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 max-w-prose text-xs text-staal-tekst">
          Dit zijn signalen, geen conclusies. Er wordt niets automatisch
          geblokkeerd: één afwijkend patroon is geen fraude, en een affiliate
          die eerlijk werkt verdient geen afgesloten account op basis van een
          telling.
        </p>
      </Paneel>

      {/* Instellingen */}
      <Paneel titel="Instellingen">
        <Instellingenformulier
          percentage={percentageTekst(instellingen.standaardPercentageBp)}
          dagen={instellingen.attributieDagen}
          drempel={(instellingen.uitbetalingsdrempelCenten / 100)
            .toFixed(2)
            .replace(".", ",")}
          frequentie={instellingen.uitbetalingsfrequentie}
          actief={instellingen.programmaActief}
        />
      </Paneel>

      {/* Auditlog */}
      <Paneel titel="Auditlog">
        {audit.length === 0 ? (
          <Leeg tekst="Nog niets vastgelegd." />
        ) : (
          <Tabel koppen={["Wanneer", "Wie", "Actie", "Reden", "Details"]}>
            {audit.map((r) => (
              <Rij key={r.id}>
                <Cel mono>{datum(r.aangemaaktOp)}</Cel>
                <Cel mono>{r.actor ?? "systeem"}</Cel>
                <Cel mono>{r.actie}</Cel>
                <Cel>{r.reden ?? "—"}</Cel>
                <Cel>{r.details ?? "—"}</Cel>
              </Rij>
            ))}
          </Tabel>
        )}
      </Paneel>
    </div>
  );
}
