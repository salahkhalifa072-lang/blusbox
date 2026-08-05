import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { leesWagen } from "@/lib/winkelwagen-cookie";
import { berekenWagen } from "@/lib/winkelwagen";
import { euro, verzendwaarde } from "@/lib/pricing";
import { wijzigWagenAantal, verwijderUitWagen } from "./acties";

export const metadata: Metadata = {
  title: "Winkelwagen",
  description: "Je winkelwagen bij Blusbox.",
  robots: { index: false },
};

export default async function WinkelwagenPage() {
  const wagen = await leesWagen();
  // Guest checkout is the default (§8); country defaults to NL and is
  // confirmed at checkout.
  const overzicht = berekenWagen(wagen, {
    landcode: "NL",
    isZakelijk: false,
    btwIdGevalideerd: false,
  });

  if (overzicht.leeg) {
    return (
      <>
        <PageHeader
          eyebrow="bestellen"
          title="Winkelwagen"
          lead="Je winkelwagen is leeg."
        />
        <main className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-2xl border border-railstaal/50 p-8">
            <h2 className="font-display text-2xl">Nog niets gekozen</h2>
            <p className="mt-3 text-staal-tekst">
              Eén module beschermt één meterkast, tien jaar lang. Verzending is
              altijd gratis.
            </p>
            <Link
              href="/blusbox"
              className="mt-6 inline-block rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
            >
              Bekijk Blusbox
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="bestellen"
        title="Winkelwagen"
        lead={`${overzicht.aantalArtikelen} artikel${
          overzicht.aantalArtikelen === 1 ? "" : "en"
        } · verzending gratis`}
      />
      <main className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          {/* Regels */}
          <div className="divide-y divide-railstaal/50 border-y border-railstaal/50">
            {overzicht.regels.map((regel) => (
              <article
                key={regel.item.slug}
                className="flex flex-wrap items-start gap-5 py-6"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-kastwit-dim">
                  <Image
                    src="/media/packshot.jpg"
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-[12rem] flex-1">
                  <h2 className="font-display text-lg">{regel.item.naam}</h2>
                  <p className="mt-1 text-sm text-staal-tekst">
                    {regel.item.omschrijving}
                  </p>
                  {regel.item.gevaarlijkeGoederen ? (
                    <p className="data mt-2 text-xs text-staal-tekst">
                      Wordt vervoerd als gevaarlijk goed
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-4">
                  <form action={wijzigWagenAantal} className="flex items-center gap-2">
                    <input type="hidden" name="slug" value={regel.item.slug} />
                    <label
                      htmlFor={`aantal-${regel.item.slug}`}
                      className="sr-only"
                    >
                      Aantal {regel.item.naam}
                    </label>
                    <input
                      id={`aantal-${regel.item.slug}`}
                      name="aantal"
                      type="number"
                      min={0}
                      max={99}
                      defaultValue={regel.aantal}
                      className="data w-16 rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-2 py-2 text-center text-sm"
                    />
                    <button
                      type="submit"
                      className="data rounded-full border border-railstaal px-3 py-2 text-xs transition-colors hover:bg-antraciet hover:text-kastwit"
                    >
                      Bijwerken
                    </button>
                  </form>

                  <p className="data w-24 text-right text-sm">
                    {euro(regel.regelExclBtwCenten)}
                  </p>
                </div>

                <form action={verwijderUitWagen}>
                  <input type="hidden" name="slug" value={regel.item.slug} />
                  <button
                    type="submit"
                    className="data text-xs text-staal-tekst underline underline-offset-4 hover:text-blusrood-op-licht"
                  >
                    Verwijderen
                  </button>
                </form>
              </article>
            ))}
          </div>

          {/* Totalen */}
          <aside className="h-fit rounded-2xl border border-railstaal/50 p-6">
            <h2 className="font-display text-xl">Overzicht</h2>

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-staal-tekst">Subtotaal excl. btw</dt>
                <dd className="data">
                  {euro(overzicht.totalen.subtotaalExclBtwCenten)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-staal-tekst">Btw 21%</dt>
                <dd className="data">
                  {euro(overzicht.totalen.btwBedragCenten)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-staal-tekst">Verzending</dt>
                <dd className="data">
                  <span className="text-staal-tekst line-through">
                    {verzendwaarde}
                  </span>{" "}
                  gratis
                </dd>
              </div>
              <div className="hairline-t flex justify-between pt-3">
                <dt className="font-medium">Totaal incl. btw</dt>
                <dd className="data text-lg">
                  {euro(overzicht.totalen.totaalInclBtwCenten)}
                </dd>
              </div>
            </dl>

            {/* §15: never offer checkout for an order we cannot ship */}
            {overzicht.verzending.toegestaan ? (
              <>
                <Link
                  href="/afrekenen"
                  className="mt-6 block rounded-full bg-blusrood-vlak px-6 py-3.5 text-center text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
                >
                  Afrekenen
                </Link>
                {overzicht.verzending.opmerking ? (
                  <p className="data mt-3 text-xs text-staal-tekst">
                    {overzicht.verzending.opmerking}
                  </p>
                ) : null}
              </>
            ) : (
              <div
                className="mt-6 rounded-xl border border-signaal bg-signaal/15 p-4"
                role="alert"
              >
                <p className="text-sm font-medium">Nog niet af te rekenen</p>
                <p className="mt-1 text-sm text-antraciet">
                  {overzicht.verzending.reden}
                </p>
                {overzicht.verzending.oplossing ? (
                  <p className="mt-2 text-sm text-antraciet">
                    {overzicht.verzending.oplossing}
                  </p>
                ) : null}
              </div>
            )}

            <p className="data mt-4 text-xs text-staal-tekst">
              14 dagen bedenktijd · altijd gratis verzending
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
