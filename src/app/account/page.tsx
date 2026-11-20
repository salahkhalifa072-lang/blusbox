import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { signIn } from "@/auth";
import { huidigeActor } from "@/lib/sessie";
import { magDashboard, magInstallateursportaal } from "@/lib/rollen";
import { affiliateVanGebruiker } from "@/db/affiliate";
import { controleerWachtwoordLogin } from "@/lib/inloggen";
import { leesTussenstap, maakTussenstap } from "@/lib/totp";
import { tweestapsActief, tweestapsStatus } from "@/lib/tweestaps";
import {
  accountAfgekoeld,
  huidigIp,
  ipGeblokkeerd,
  registreerPoging,
} from "@/lib/inlogbewaking";

/** Vijf minuten geldig, alleen voor deze pagina, niet leesbaar voor scripts. */
const TUSSENSTAP_COOKIE = "blusbox-tussenstap";

function isRedirect(e: unknown): boolean {
  // next-auth signals a successful redirect by throwing; only a real
  // failure should come back as an error.
  return (
    (e as Error)?.message === "NEXT_REDIRECT" ||
    Boolean((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT"))
  );
}

export const metadata: Metadata = {
  title: "Inloggen",
  robots: { index: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ fout?: string; stap?: string }>;
}) {
  const { fout, stap } = await searchParams;

  // Already signed in: send people where they belong rather than showing
  // them a login form they do not need.
  const actor = await huidigeActor();
  if (actor) {
    if (magDashboard(actor.rol)) redirect("/dashboard");
    if (magInstallateursportaal(actor.rol)) redirect("/portaal");
    if (actor.rol === "verkoper") redirect("/verkoop");

    /*
     * Partners horen op hun eigen dashboard.
     *
     * Op het bestaan van een affiliate-record en niet op de rol: wie zich
     * net heeft aangemeld staat op "aangevraagd" en houdt tot de
     * goedkeuring rol `klant`. De aanmeldbevestiging zegt wél dat hij
     * alvast kan inloggen — en dat liep hier dood. Hij werd netjes
     * ingelogd en vervolgens naar de homepage gestuurd, waar niets laat
     * zien dat het gelukt is. Van buiten af is dat niet te onderscheiden
     * van "inloggen werkt niet".
     *
     * Het dashboard zelf vangt elke status af, inclusief een afgewezen
     * aanvraag, dus hier hoeft niet op status gefilterd te worden.
     */
    const partner = await affiliateVanGebruiker(actor.id);
    if (partner) redirect("/affiliate/dashboard");

    redirect("/");
  }

  /*
   * Stap 1: e-mail en wachtwoord.
   *
   * Staat tweestapsverificatie aan, dan wordt hier nog niet ingelogd. De
   * browser krijgt een kortlevend briefje dat het wachtwoord klopte, en
   * gaat door naar het codescherm.
   */
  async function inloggen(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const wachtwoord = String(formData.get("wachtwoord") ?? "");

    // Eerst de bewaking: een geblokkeerd adres of een account onder vuur
    // komt niet eens bij de wachtwoordcontrole.
    const ip = await huidigIp();
    if (await ipGeblokkeerd(ip)) redirect("/account?fout=geblokkeerd");
    if (await accountAfgekoeld(email)) redirect("/account?fout=afkoelen");

    const gebruiker = await controleerWachtwoordLogin(email, wachtwoord);
    const { geblokkeerd } = await registreerPoging({
      ip,
      email,
      soort: "wachtwoord",
      gelukt: Boolean(gebruiker),
    });
    if (!gebruiker) redirect(geblokkeerd ? "/account?fout=geblokkeerd" : "/account?fout=1");

    // Het wachtwoord gaat niet verder dan hier. Wat naar Auth.js gaat, is
    // het briefje dat het klopte (en zo nodig straks de code).
    const briefje = maakTussenstap(gebruiker.id);

    if (await tweestapsActief(gebruiker.id)) {
      (await cookies()).set(TUSSENSTAP_COOKIE, briefje, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/account",
        maxAge: 5 * 60,
      });
      redirect("/account?stap=code");
    }

    try {
      await signIn("credentials", { tussenstap: briefje, redirectTo: "/account" });
    } catch (e) {
      if (isRedirect(e)) throw e;
      redirect("/account?fout=1");
    }
  }

  /* Stap 2: de code uit de authenticator-app, of een herstelcode. */
  async function bevestigCode(formData: FormData) {
    "use server";
    const opslag = await cookies();
    const tussenstap = opslag.get(TUSSENSTAP_COOKIE)?.value ?? "";
    const userId = tussenstap ? leesTussenstap(tussenstap) : null;
    if (!userId) redirect("/account?fout=verlopen");

    if (await ipGeblokkeerd(await huidigIp())) redirect("/account?fout=geblokkeerd");
    if ((await tweestapsStatus(userId)).geblokkeerdTot) {
      redirect("/account?stap=code&fout=slot");
    }

    try {
      await signIn("credentials", {
        tussenstap,
        code: String(formData.get("code") ?? ""),
        redirectTo: "/account",
      });
    } catch (e) {
      if (isRedirect(e)) {
        opslag.delete({ name: TUSSENSTAP_COOKIE, path: "/account" });
        throw e;
      }
      if (await ipGeblokkeerd(await huidigIp())) redirect("/account?fout=geblokkeerd");
      const slot = (await tweestapsStatus(userId)).geblokkeerdTot;
      redirect(`/account?stap=code&fout=${slot ? "slot" : "code"}`);
    }
  }

  // Het codescherm alleen tonen als het briefje er nog is; anders kan
  // iemand met ?stap=code in de adresbalk een leeg codeveld openen.
  const tussenstap = (await cookies()).get(TUSSENSTAP_COOKIE)?.value;
  const codeStap = stap === "code" && Boolean(tussenstap && leesTussenstap(tussenstap));

  if (codeStap) {
    return (
      <>
        <PageHeader
          eyebrow="account"
          title="Code invoeren"
          lead="Open je authenticator-app en typ de code van zes cijfers die bij Blusbox staat."
        />
        <main className="mx-auto max-w-md px-6 py-16">
          {fout ? (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-signaal bg-signaal/15 p-4"
            >
              {fout === "slot" ? (
                <>
                  <p className="text-sm font-medium">Even geduld</p>
                  <p className="mt-1 text-sm">
                    Te vaak een verkeerde code. Inloggen is een kwartier
                    geblokkeerd voor dit account.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Code klopt niet</p>
                  <p className="mt-1 text-sm">
                    Neem de code die nu in de app staat. Elke code werkt één
                    keer en ververst elke 30 seconden.
                  </p>
                </>
              )}
            </div>
          ) : null}

          <form action={bevestigCode} className="space-y-5">
            <div>
              <label htmlFor="code" className="block text-sm font-medium">
                Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                maxLength={9}
                aria-describedby="code-hulp"
                className="data mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-4 py-3 text-lg tracking-[0.3em]"
              />
              <p id="code-hulp" className="mt-1.5 text-xs text-staal-tekst">
                Telefoon kwijt? Typ dan een van je herstelcodes, zoals
                ABCD-EFGH. Elke herstelcode werkt één keer.
              </p>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-blusrood-vlak px-6 py-3.5 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
            >
              Inloggen
            </button>
          </form>

          <Link
            href="/account"
            className="mt-6 inline-block text-sm underline underline-offset-4 hover:text-staal-tekst"
          >
            Opnieuw beginnen
          </Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="account"
        title="Inloggen"
        lead="Voor beheerders en installateurs. Klanten hebben geen account nodig om te bestellen."
      />
      <main className="mx-auto max-w-md px-6 py-16">
        {fout ? (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-signaal bg-signaal/15 p-4"
          >
            {fout === "geblokkeerd" ? (
              <>
                <p className="text-sm font-medium">Inloggen geblokkeerd</p>
                <p className="mt-1 text-sm">
                  Vanaf dit netwerk zijn te veel verkeerde pogingen gedaan.
                  Inloggen is daarom tijdelijk geblokkeerd. Ben je zelf
                  beheerder, probeer het dan via een ander netwerk, zoals 4G
                  op je telefoon.
                </p>
              </>
            ) : fout === "afkoelen" ? (
              <>
                <p className="text-sm font-medium">Even pauze</p>
                <p className="mt-1 text-sm">
                  Op dit account zijn net te veel verkeerde pogingen gedaan.
                  Probeer het over een kwartier opnieuw.
                </p>
              </>
            ) : fout === "verlopen" ? (
              <>
                <p className="text-sm font-medium">Te lang gewacht</p>
                <p className="mt-1 text-sm">
                  Voor de veiligheid moet de code binnen vijf minuten na het
                  wachtwoord. Log opnieuw in.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Inloggen mislukt</p>
                <p className="mt-1 text-sm">
                  Controleer je e-mailadres en wachtwoord en probeer het
                  opnieuw.
                </p>
              </>
            )}
          </div>
        ) : null}

        <form action={inloggen} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              E-mailadres
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label htmlFor="wachtwoord" className="block text-sm font-medium">
              Wachtwoord
            </label>
            <input
              id="wachtwoord"
              name="wachtwoord"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-4 py-3 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-blusrood-vlak px-6 py-3.5 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
          >
            Inloggen
          </button>
        </form>

        <Link
          href="/wachtwoord-vergeten"
          className="mt-6 inline-block text-sm underline underline-offset-4 hover:text-staal-tekst"
        >
          Wachtwoord vergeten?
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
