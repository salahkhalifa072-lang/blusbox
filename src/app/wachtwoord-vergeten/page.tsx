import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { vraagHerstelAan } from "@/db/wachtwoord-herstel";
import { stuurHerstelmail } from "@/lib/wachtwoord-mail";
import { GELDIGHEID_MINUTEN } from "@/lib/wachtwoord-herstel";

export const metadata: Metadata = {
  title: "Wachtwoord vergeten",
  robots: { index: false, follow: false },
};

/**
 * Een herstelmail aanvragen.
 *
 * De pagina zegt altijd hetzelfde, of het adres nu bestaat of niet. Dat
 * is niet uit beleefdheid: een formulier dat "dit adres kennen wij niet"
 * antwoordt, is een manier om uit te vinden wie er een account heeft. Bij
 * een affiliateprogramma is dat meteen een ledenlijst.
 *
 * Om dezelfde reden staat er geen verschil tussen "mail verstuurd" en "te
 * vaak gevraagd" — beide eindigen op dit scherm.
 */
export default async function WachtwoordVergetenPage({
  searchParams,
}: {
  searchParams: Promise<{ verstuurd?: string }>;
}) {
  const { verstuurd } = await searchParams;

  async function aanvragen(formData: FormData) {
    "use server";
    const { redirect } = await import("next/navigation");
    const email = String(formData.get("email") ?? "");

    const aanvraag = await vraagHerstelAan(email);
    if (aanvraag) {
      const resultaat = await stuurHerstelmail({
        naar: email.trim().toLowerCase(),
        naam: aanvraag.naam,
        token: aanvraag.token,
      }).catch((fout: unknown) => ({
        verstuurd: false as const,
        reden: String(fout),
      }));

      // Mislukt de verzending, dan ziet de bezoeker dat niet — maar wij
      // wel. Zonder deze regel verdwijnt een kapotte mailkoppeling
      // geruisloos en blijft iedereen buitengesloten.
      if (!resultaat.verstuurd) {
        console.error("Herstelmail niet verstuurd:", resultaat.reden);
      }
    }

    redirect("/wachtwoord-vergeten?verstuurd=1");
  }

  return (
    <>
      <PageHeader
        eyebrow="account"
        title="Wachtwoord vergeten"
        lead="Vul je e-mailadres in; je krijgt een link om een nieuw wachtwoord in te stellen."
      />
      <main className="mx-auto max-w-md px-6 py-16">
        {verstuurd ? (
          <>
            <div
              role="status"
              className="rounded-2xl border border-railstaal/60 bg-kastwit-dim p-5"
            >
              <p className="text-sm font-medium">Kijk in je mail</p>
              <p className="mt-2 text-sm leading-relaxed">
                Is dit adres bij ons bekend, dan is er een bericht onderweg met
                een link om je wachtwoord opnieuw in te stellen. Die link werkt{" "}
                {GELDIGHEID_MINUTEN} minuten.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-staal-tekst">
                Niets ontvangen? Kijk in je ongewenste post. Staat het er ook
                niet, dan hoort dit adres waarschijnlijk niet bij een account.
              </p>
            </div>
            <Link
              href="/account"
              className="data mt-6 inline-block text-sm underline underline-offset-4"
            >
              Terug naar inloggen
            </Link>
          </>
        ) : (
          <>
            <form action={aanvragen} className="space-y-5">
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

              <button
                type="submit"
                className="w-full rounded-full bg-blusrood-vlak px-6 py-3.5 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
              >
                Stuur me een herstellink
              </button>
            </form>

            <Link
              href="/account"
              className="data mt-6 inline-block text-sm underline underline-offset-4"
            >
              Terug naar inloggen
            </Link>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
