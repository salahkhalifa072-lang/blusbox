import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lots, recallNotices, recalls } from "@/db/schema";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { formatteerNl } from "@/lib/levensduur";
import { bevestigOntvangst } from "./acties";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terugroepactie",
  // Deze pagina hoort bij één persoon en heeft in een zoekmachine niets
  // te zoeken.
  robots: { index: false, follow: false },
};

export default async function TerugroepPagina({
  params,
}: {
  params: Promise<{ noticeId: string }>;
}) {
  const { noticeId } = await params;

  // Een ongeldige uuid mag geen databasefout worden.
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      noticeId,
    );
  if (!isUuid) notFound();

  const [notice] = await db
    .select({
      id: recallNotices.id,
      bevestigdOp: recallNotices.bevestigdOp,
      lotNummer: lots.lotNummer,
      reden: recalls.reden,
      geopendOp: recalls.geopendOp,
      geslotenOp: recalls.geslotenOp,
    })
    .from(recallNotices)
    .innerJoin(recalls, eq(recalls.id, recallNotices.recallId))
    .innerJoin(lots, eq(lots.id, recalls.lotId))
    .where(eq(recallNotices.id, noticeId))
    .limit(1);

  if (!notice) notFound();

  const bevestigd = Boolean(notice.bevestigdOp);

  return (
    <>
      <SiteHeader />
      <main className="pb-24">
        {/* Antracietband met een rode markering, geen rood vlak: de kop van de
            site draagt zelf een rode knop, en rood op rood leest slecht. De
            markering doet het signaalwerk, §6 houdt rood daarmee één keer per
            scherm. */}
        <section className="bg-antraciet pb-14 pt-36 text-kastwit sm:pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="data inline-flex items-center rounded-full bg-blusrood-vlak px-3 py-1 text-xs uppercase tracking-widest">
              Veiligheidswaarschuwing
            </p>
            <h1 className="font-display mt-5 text-[clamp(2.25rem,6vw,4rem)]">
              Vervang je Blusbox
            </h1>
            {/* Het lotnummer los, in de dataface: in de displaykop staat het
                mono-nummer op een andere grootte en breekt de regel. */}
            <p className="data mt-3 text-lg text-blusrood-op-donker">
              lot {notice.lotNummer}
            </p>
            <p className="mt-5 max-w-2xl text-lg text-kastwit/75">
              Ga ervan uit dat je module op dit moment geen bescherming biedt.
              Je krijgt kosteloos een vervanging.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-6 py-14">
          <h2 className="font-display text-2xl">Wat er aan de hand is</h2>
          <p className="mt-3 leading-relaxed text-staal-tekst">{notice.reden}</p>
          <p className="data mt-4 text-xs text-staal-tekst">
            Terugroepactie geopend op{" "}
            {formatteerNl(notice.geopendOp.toISOString().slice(0, 10))}
            {notice.geslotenOp
              ? ` · afgerond op ${formatteerNl(
                  notice.geslotenOp.toISOString().slice(0, 10),
                )}`
              : null}
          </p>

          <h2 className="font-display mt-12 text-2xl">Wat je moet doen</h2>
          <ol className="mt-4 space-y-4">
            {[
              {
                kop: "Laat de module zitten",
                regel:
                  "Haal hem niet zelf uit de meterkast en gooi hem niet bij het afval. De module bevat een blusmiddel en valt onder de regels voor gevaarlijke goederen.",
              },
              {
                kop: "Bevestig dit bericht",
                regel:
                  "Met de knop hieronder. Zolang we die bevestiging niet hebben, blijven we contact zoeken.",
              },
              {
                kop: "Je ontvangt een vervangende module",
                regel:
                  "Kosteloos, met instructies en de vervoersdocumenten om de oude terug te sturen.",
              },
            ].map((stap, i) => (
              <li
                key={stap.kop}
                className="flex gap-4 rounded-2xl border border-railstaal/45 p-5"
              >
                <span className="data text-sm text-staal-tekst">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-medium">{stap.kop}</p>
                  <p className="mt-1 text-sm leading-relaxed text-staal-tekst">
                    {stap.regel}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 rounded-2xl border border-railstaal/45 bg-kastwit-dim p-6">
            {bevestigd ? (
              <>
                <p className="font-medium">Bedankt, we hebben je bevestiging.</p>
                <p className="data mt-1 text-sm text-staal-tekst">
                  Geregistreerd op{" "}
                  {formatteerNl(
                    notice.bevestigdOp!.toISOString().slice(0, 10),
                  )}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-staal-tekst">
                  We nemen contact met je op over de vervangende module. Je
                  hoeft verder niets te doen.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">
                  Bevestig dat je dit gelezen hebt
                </p>
                <p className="mt-1 text-sm leading-relaxed text-staal-tekst">
                  Dan weten we dat je op de hoogte bent en kunnen we de
                  vervanging in gang zetten.
                </p>
                <form action={bevestigOntvangst} className="mt-4">
                  <input type="hidden" name="noticeId" value={notice.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-blusrood-vlak px-7 py-3.5 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
                  >
                    Ik heb dit gelezen
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="mt-8 text-sm leading-relaxed text-staal-tekst">
            Vragen? Neem contact op via{" "}
            <Link
              href="/contact"
              className="underline underline-offset-4 hover:text-antraciet"
            >
              onze contactpagina
            </Link>{" "}
            en vermeld lotnummer{" "}
            <span className="data">{notice.lotNummer}</span>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
