import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { vereisLogin } from "@/lib/sessie";
import { inGroepjes, otpauthLink } from "@/lib/totp";
import { lopendeKoppeling, tweestapsStatus } from "@/lib/tweestaps";
import { annuleer, begin, bevestig, nieuweCodes, zetUit } from "./acties";
import { Koppelen, NieuweHerstelcodes, Uitzetten } from "./formulieren";

export const metadata: Metadata = {
  title: "Beveiliging",
  robots: { index: false, follow: false },
};

const datum = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Amsterdam",
});

/**
 * Tweestapsverificatie aan- en uitzetten.
 *
 * Werkt met elke authenticator-app die de standaard volgt: Google
 * Authenticator, Microsoft Authenticator, 1Password, Authy. Na het
 * aanzetten vraagt inloggen naast het wachtwoord ook de code uit de app.
 */
export default async function BeveiligingPage({
  searchParams,
}: {
  searchParams: Promise<{ uit?: string }>;
}) {
  const actor = await vereisLogin();
  const { uit } = await searchParams;
  const status = await tweestapsStatus(actor.id);
  const geheim = status.actief ? null : await lopendeKoppeling(actor.id);

  const qr = geheim
    ? await QRCode.toString(otpauthLink(geheim, actor.email), {
        type: "svg",
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#16181a", light: "#ffffff" },
      })
    : null;

  return (
    <>
      <PageHeader
        eyebrow="account"
        title="Beveiliging"
        lead="Inloggen met je wachtwoord én een code uit een app op je telefoon. Wie je wachtwoord weet, komt er dan nog niet in."
      />
      <main className="mx-auto max-w-2xl space-y-10 px-6 py-16">
        <p className="data text-xs text-staal-tekst">Ingelogd als {actor.email}</p>

        {uit ? (
          <p role="status" className="rounded-xl border border-antraciet/20 bg-kastwit-dim px-4 py-3 text-sm">
            Tweestapsverificatie staat uit. Je logt weer in met alleen je
            wachtwoord.
          </p>
        ) : null}

        {status.actief ? (
          <>
            <section className="space-y-2">
              <h2 className="font-display text-2xl">Tweestapsverificatie staat aan</h2>
              <p className="text-sm text-staal-tekst">
                Sinds {status.actiefOp ? datum.format(status.actiefOp) : "onbekend"}.
                Nog {status.herstelcodesOver} van de 8 herstelcodes ongebruikt.
              </p>
            </section>

            <section className="space-y-4 border-t border-railstaal/50 pt-8">
              <h2 className="font-medium">Nieuwe herstelcodes</h2>
              <p className="text-sm text-staal-tekst">
                Bijna op, of weet je niet meer waar ze liggen? Maak een nieuwe
                set. De oude codes werken daarna niet meer.
              </p>
              <NieuweHerstelcodes actie={nieuweCodes} />
            </section>

            <section className="space-y-4 border-t border-railstaal/50 pt-8">
              <h2 className="font-medium">Nieuwe telefoon of uitzetten</h2>
              <p className="text-sm text-staal-tekst">
                Overstappen naar een andere telefoon: zet het hier uit en
                daarna meteen weer aan met de nieuwe telefoon.
              </p>
              <Uitzetten actie={zetUit} />
            </section>
          </>
        ) : geheim && qr ? (
          <section className="space-y-8">
            <Koppelen
              actie={bevestig}
              uitleg={
                <>
                  <div className="space-y-2">
                    <h2 className="font-display text-2xl">Koppel je app</h2>
                    <p className="text-sm text-staal-tekst">
                      1. Installeer Google Authenticator (of een andere
                      authenticator-app) op je telefoon.
                    </p>
                    <p className="text-sm text-staal-tekst">
                      2. Tik in de app op <span className="font-medium">+</span>{" "}
                      en scan deze code.
                    </p>
                  </div>

                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div
                      className="w-48 shrink-0 rounded-2xl border border-railstaal bg-white p-3"
                      role="img"
                      aria-label="QR-code om Blusbox aan je authenticator-app toe te voegen"
                      dangerouslySetInnerHTML={{ __html: qr }}
                    />
                    <div className="text-sm">
                      <p className="text-staal-tekst">
                        Scannen lukt niet? Kies in de app voor een sleutel invoeren:
                      </p>
                      <p className="data mt-2 select-all break-all rounded-lg bg-kastwit-dim px-3 py-2 text-base">
                        {inGroepjes(geheim)}
                      </p>
                      <p className="mt-2 text-xs text-staal-tekst">
                        Accountnaam: Blusbox. Type: op tijd gebaseerd.
                      </p>
                    </div>
                  </div>
                </>
              }
              onder={
                <form action={annuleer}>
                  <button
                    type="submit"
                    className="text-sm underline underline-offset-4 hover:text-staal-tekst"
                  >
                    Annuleren
                  </button>
                </form>
              }
            />
          </section>
        ) : (
          <section className="space-y-4">
            <h2 className="font-display text-2xl">Tweestapsverificatie staat uit</h2>
            <p className="text-sm text-staal-tekst">
              Je hebt een authenticator-app nodig op je telefoon, zoals Google
              Authenticator. Het instellen duurt een minuut.
            </p>
            <form action={begin}>
              <button
                type="submit"
                className="rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-medium text-kastwit hover:bg-[#9e1b18]"
              >
                Instellen
              </button>
            </form>
          </section>
        )}

        <Link href="/account" className="inline-block text-sm underline underline-offset-4 hover:text-staal-tekst">
          Terug
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
