import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader, SectionTitle } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { Reveal } from "@/components/ui/reveal";
import { LogoBadge } from "@/components/site/logo";

export const metadata: Metadata = {
  title: "Installatie",
  description:
    "Blusbox monteren op de DIN-rail in de meterkast: voorbereiding, plaatsing, registratie van de installatiedatum en wat te doen na een activering.",
  alternates: { canonical: "/installatie" },
};

const stappen = [
  {
    nr: "01",
    t: "Schakel de installatie spanningsloos",
    b: "Zet de hoofdschakelaar uit voordat je in de kast werkt. De module zelf heeft geen aansluiting nodig, maar je werkt wel in een verdeelinrichting.",
  },
  {
    nr: "02",
    t: "Kies de plaats op de rail",
    b: "Blusbox klikt op dezelfde DIN-rail als je automaten. Houd de vrije breedte aan die in de handleiding staat: [VERIFY: benodigde modulebreedte].",
  },
  {
    nr: "03",
    t: "Klik de module vast",
    b: "Haak de clip over de bovenrand van de rail en druk de module aan tot hij hoorbaar vastklikt. Controleer of hij niet meer kan schuiven.",
  },
  {
    nr: "04",
    t: "Leg het detectiekoord",
    b: "Voer het koord langs de componenten die de meeste warmte kunnen ontwikkelen. Vermijd knikken en klem het koord niet in.",
  },
  {
    nr: "05",
    t: "Schakel in en controleer",
    b: "Zet de installatie weer onder spanning. Er is niets in te schakelen of te testen aan de module zelf: hij is vanaf nu passief actief.",
  },
  {
    nr: "06",
    t: "Registreer de installatiedatum",
    b: "Noteer het lotnummer en de datum in je account. Daarmee staat de vervangingsdatum vast en krijg je op tijd bericht.",
  },
];

export default function InstallatiePage() {
  return (
    <>
      <PageHeader
        eyebrow="montage"
        title="Klikken, koord leggen,"
        accent="registreren."
        lead="Blusbox heeft geen aansluiting, geen instelling en geen inbedrijfstelling. De montage bestaat uit drie handelingen — de vierde is het vastleggen van de datum."
      />
      <main>
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <Reveal>
              <ol className="space-y-8">
                {stappen.map((s) => (
                  <li key={s.nr} className="flex gap-5">
                    <span className="data mt-1 shrink-0 text-sm text-blusrood-op-licht">
                      {s.nr}
                    </span>
                    <div>
                      <h2 className="font-display text-xl">{s.t}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-staal-tekst">
                        {s.b}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={100}>
              <div className="lg:sticky lg:top-28">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <Image
                    src="/media/meterkast-front.jpg"
                    alt="Vooraanzicht van een meterkast met de Blusbox-module gemonteerd op de middelste DIN-rail"
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                  />
                  <LogoBadge />
                </div>
                <div className="mt-4 rounded-2xl border border-railstaal/50 p-6">
                  <h2 className="font-display text-lg">Laat je het doen?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-staal-tekst">
                    De module vraagt geen elektrotechnische aansluiting, maar
                    werken in de meterkast blijft werken in de meterkast. Twijfel
                    je, laat het dan door een installateur doen — die plaatst hem
                    binnen een paar minuten.
                  </p>
                  <Link
                    href="/downloads"
                    className="data mt-4 inline-block text-xs underline underline-offset-4"
                  >
                    Handleiding downloaden
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Na een activering */}
        <section className="bg-antraciet py-20 text-kastwit">
          <div className="mx-auto max-w-6xl px-6">
            <SectionTitle>Na een activering</SectionTitle>
            <p className="mt-4 max-w-2xl text-kastwit/70">
              Is de module afgegaan, dan heeft hij zijn werk gedaan en is hij
              verbruikt. Belangrijker: de oorzaak van de warmte zit nog in je
              kast.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  t: "Laat de installatie controleren",
                  b: "Schakel een installateur in voordat je de groep weer belast. De activering is een symptoom, geen oplossing.",
                },
                {
                  t: "Meld de activering",
                  b: "Registreer datum, locatietype en oorzaak in je account. Daarmee bouwen we praktijkdata op die niemand anders heeft.",
                },
                {
                  t: "Plaats een vervangmodule",
                  b: "Een gebruikte module beschermt niets meer. De vervanging bestel je direct vanuit je account.",
                },
              ].map((x, i) => (
                <Reveal key={x.t} delay={i * 70}>
                  <article className="h-full rounded-2xl border border-kastwit/15 p-6">
                    <h3 className="font-display text-lg">{x.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-kastwit/70">
                      {x.b}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
