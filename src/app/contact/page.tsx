import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { bedrijf } from "@/lib/bedrijf";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Stel je vraag over Blusbox, vraag een zakelijke offerte aan of stuur een foto van je meterkast voor advies over de plaatsing.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="contact"
        title="Stel je vraag"
        lead="Vragen over plaatsing, levering of een zakelijke aanvraag komen bij iemand terecht die het product kent. Reactie binnen één werkdag."
      />
      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          {/* Form — wired up when the mail route lands (§14 step 6) */}
          <form className="space-y-5" aria-describedby="form-status">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="naam" className="block text-sm font-medium">
                  Naam
                </label>
                <input
                  id="naam"
                  name="naam"
                  type="text"
                  autoComplete="name"
                  disabled
                  className="mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-4 py-3 text-sm disabled:opacity-60"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  E-mailadres
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  disabled
                  className="mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-4 py-3 text-sm disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label htmlFor="onderwerp" className="block text-sm font-medium">
                Onderwerp
              </label>
              <select
                id="onderwerp"
                name="onderwerp"
                disabled
                defaultValue="vraag"
                className="mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-4 py-3 text-sm disabled:opacity-60"
              >
                <option value="vraag">Vraag over het product</option>
                <option value="plaatsing">Past het in mijn meterkast?</option>
                <option value="zakelijk">Zakelijke offerte</option>
                <option value="dealer">Dealeraccount aanvragen</option>
                <option value="bestelling">Vraag over een bestelling</option>
              </select>
            </div>

            <div>
              <label htmlFor="bericht" className="block text-sm font-medium">
                Bericht
              </label>
              <textarea
                id="bericht"
                name="bericht"
                rows={6}
                disabled
                className="mt-1.5 w-full rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-4 py-3 text-sm disabled:opacity-60"
              />
              <p className="mt-1.5 text-xs text-staal-tekst">
                Gaat je vraag over de plaatsing? Voeg dan een foto van je open
                meterkast toe — dat scheelt een mailwisseling.
              </p>
            </div>

            <button
              type="submit"
              disabled
              className="rounded-full bg-blusrood-vlak px-7 py-3.5 text-sm font-medium text-kastwit disabled:cursor-not-allowed disabled:opacity-60"
            >
              Versturen
            </button>
            <p id="form-status" className="data text-xs text-staal-tekst">
              Het formulier wordt geactiveerd zodra de mailkoppeling live staat.
              Gebruik tot die tijd het e-mailadres hiernaast.
            </p>
          </form>

          {/* Company details — §8 requires these to be findable */}
          <aside className="h-fit rounded-2xl border border-railstaal/50 p-8">
            <h2 className="font-display text-2xl">{bedrijf.naam}</h2>
            <dl className="data mt-6 space-y-4 text-sm">
              {[
                ["E-mail", bedrijf.email],
                ["Telefoon", bedrijf.telefoon],
                ["Handelsnaam", bedrijf.volledig],
                ["KvK", bedrijf.kvk],
                ["Btw-id", bedrijf.btwId],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase tracking-wider text-staal-tekst">
                    {k}
                  </dt>
                  <dd className="mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm leading-relaxed text-staal-tekst">
              Voor vragen over een lopende bestelling: vermeld je bestelnummer,
              dan zoeken we het direct op.
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
