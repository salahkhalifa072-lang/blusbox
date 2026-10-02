import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { signIn } from "@/auth";
import { huidigeActor } from "@/lib/sessie";
import { magDashboard, magInstallateursportaal } from "@/lib/rollen";
import { affiliateVanGebruiker } from "@/db/affiliate";

export const metadata: Metadata = {
  title: "Inloggen",
  robots: { index: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ fout?: string }>;
}) {
  const { fout } = await searchParams;

  // Already signed in: send people where they belong rather than showing
  // them a login form they do not need.
  const actor = await huidigeActor();
  if (actor) {
    if (magDashboard(actor.rol)) redirect("/dashboard");
    if (magInstallateursportaal(actor.rol)) redirect("/portaal");

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

  async function inloggen(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: String(formData.get("email") ?? ""),
        wachtwoord: String(formData.get("wachtwoord") ?? ""),
        redirectTo: "/account",
      });
    } catch (e) {
      // next-auth signals a successful redirect by throwing; only a real
      // failure should come back as an error.
      if ((e as Error)?.message === "NEXT_REDIRECT") throw e;
      if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw e;
      redirect("/account?fout=1");
    }
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
            <p className="text-sm font-medium">Inloggen mislukt</p>
            <p className="mt-1 text-sm">
              Controleer je e-mailadres en wachtwoord en probeer het opnieuw.
            </p>
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
