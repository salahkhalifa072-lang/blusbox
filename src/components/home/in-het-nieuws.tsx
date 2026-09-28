import { Reveal } from "@/components/ui/reveal";

/**
 * Verwijzing naar de berichtgeving over meterkastbranden.
 *
 * Bewust zonder het logo van de NOS. Een omroeplogo op een verkooppagina
 * wekt de indruk dat die omroep het product aanbeveelt, en dat doet de NOS
 * niet — het artikel gaat over overbelaste meterkasten en noemt Blusbox
 * nergens. De naam noemen bij een citaat mag en is normaal; het beeldmerk
 * overnemen is een andere zaak.
 *
 * Even belangrijk is wat er in de tekst níét staat. Het artikel wijst op
 * verkeerd aangesloten installaties, en daar is een blusmodule geen
 * oplossing voor: die voorkomt geen fout in de bedrading. Doen alsof van
 * wel zou de bezoeker een verkeerd gevoel van veiligheid geven, en dat is
 * bij een brandveiligheidsproduct het laatste wat je wil. Wat hier staat
 * is dus wat het product wél doet: ingrijpen als het tóch misgaat.
 */

const BRON = {
  titel:
    "Steeds vaker brand in meterkast door verkeerd aansluiten van warmtepomp en laadpaal",
  medium: "NOS Nieuws",
  datum: "27 juli",
  url: "https://nos.nl/artikel/2624596-steeds-vaker-brand-in-meterkast-door-verkeerd-aansluiten-van-warmtepomp-en-laadpaal",
} as const;

export function InHetNieuws() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-20">
      <Reveal>
        <div className="rounded-2xl border border-railstaal/50 bg-kastwit-dim p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <p className="data text-xs uppercase tracking-widest text-staal-tekst">
                in het nieuws
              </p>

              {/* blockquote en cite: dit is een citaat van een ander, en
                  dat hoort ook in de opmaak te staan — niet alleen visueel
                  maar ook voor wie de pagina voorgelezen krijgt. */}
              <blockquote className="mt-3" cite={BRON.url}>
                <p className="font-display text-[clamp(1.5rem,3.2vw,2.25rem)] leading-[1.15]">
                  “{BRON.titel}”
                </p>
              </blockquote>

              <p className="data mt-3 text-xs text-staal-tekst">
                {BRON.medium} · {BRON.datum}
              </p>

              <p className="mt-5 max-w-prose text-sm leading-relaxed text-staal-tekst">
                Warmtepompen, laadpalen en zonnepanelen trekken langdurig
                stroom door een kast die daar vaak niet op gebouwd is. Het
                aantal elektriciteitsongelukken in huis steeg volgens
                Netbeheer Nederland van twee naar drie per week.
              </p>

              <a
                href={BRON.url}
                target="_blank"
                rel="noopener noreferrer"
                className="data mt-5 inline-flex items-center gap-1.5 text-sm underline underline-offset-4 hover:text-antraciet"
              >
                Lees het artikel bij de NOS
                <span aria-hidden>↗</span>
                <span className="sr-only">(opent in een nieuw venster)</span>
              </a>
            </div>

            {/* Wat dit voor Blusbox betekent — en vooral wat niet. */}
            <div className="border-t border-railstaal/50 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="font-medium">Waar Blusbox in past</p>
              <p className="mt-2 text-sm leading-relaxed text-staal-tekst">
                Een blusmodule repareert geen verkeerd aangesloten groep.
                Laat je installatie nakijken door iemand met zegelrecht —
                dat is het advies in het artikel, en het onze ook.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-staal-tekst">
                Blusbox is wat er overblijft als het tóch misgaat: bij
                170&nbsp;°C dooft de module de brand in de kast, zonder
                stroom en zonder dat er iemand thuis hoeft te zijn.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
