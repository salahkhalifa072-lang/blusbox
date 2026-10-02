import { gratisVerzending, verzendwaarde } from "@/lib/pricing";
import {
  IcoonLevensduur,
  IcoonRetour,
  IcoonTemperatuur,
  IcoonVerzending,
} from "@/components/site/pictogrammen";

/**
 * Announcement strip pinned above the header — the standard place a Dutch
 * webshop states its shipping promise. One line, one message.
 */
export function ShippingBanner() {
  return (
    <div className="bg-blusrood-vlak text-kastwit">
      <p className="data mx-auto flex max-w-6xl items-center justify-center gap-2 px-6 py-2 text-[11px] uppercase tracking-widest sm:text-xs">
        <IcoonVerzending className="h-3.5 w-3.5 shrink-0" />
        <span>
          {gratisVerzending.kort} · t.w.v. {verzendwaarde}
        </span>
      </p>
    </div>
  );
}

/**
 * Eén accentkleur per tegel.
 *
 * Het palet van de site is bewust krap: blusrood is van de module en van
 * grote displaytekst, signaalgeel is van het 170 °C-moment. Die twee
 * blijven dus waar ze horen — geel staat hier op precies de tegel die
 * over 170 °C gaat, en de ISO-rood van de hero wordt niet verdubbeld.
 *
 * De andere twee accenten zijn gedempte tonen die naast antraciet staan
 * zonder met het rood te concurreren. Ze zitten alleen in het pictogram
 * en in een haarlijn bovenaan; een tegel vol kleur zou de hero
 * overschreeuwen, en dat is de ene plek waar de aandacht hoort.
 */
const usps = [
  {
    Icoon: IcoonVerzending,
    kop: gratisVerzending.kort,
    regel: `Geen minimumbedrag — wij rekenen de ${verzendwaarde} nooit door.`,
    kort: "Geen minimumbedrag",
    accent: "#4f9e78",
  },
  {
    Icoon: IcoonTemperatuur,
    kop: "Zelfactiverend bij 170 °C",
    regel: "Geen stroom, geen bediening, geen mens nodig.",
    kort: "Zonder stroom of mens",
    accent: "var(--signaal)",
  },
  {
    Icoon: IcoonLevensduur,
    kop: "10 jaar levensduur",
    regel: "Met automatisch bericht voordat de termijn verloopt.",
    kort: "Met vervangingsbericht",
    accent: "#6f9cc4",
  },
  {
    Icoon: IcoonRetour,
    kop: "14 dagen bedenktijd",
    regel: "Niet tevreden? Binnen veertien dagen retour.",
    kort: "Gewoon terugsturen",
    accent: "var(--blusrood-op-donker)",
  },
];

/**
 * Trust row under the hero.
 *
 * Twee naast twee op mobiel, vier naast elkaar vanaf tablet. Ze stonden
 * onder elkaar, waardoor je op een telefoon vier schermhoogtes aan
 * beloftes moest doorscrollen voordat de pagina verderging — precies de
 * plek waar mensen afhaken.
 *
 * Op een donkere band, zodat de rij zich losmaakt van de lichte pagina
 * eromheen en niet meer als voettekst wordt gelezen. De korte regel is
 * voor smalle schermen, de lange voor breed: in een halve telefoonbreedte
 * loopt een hele zin over vier regels en dan is het geen tegel meer maar
 * een alinea.
 *
 * De titels zijn geen koppen: de lijst is zelf de structuur, en een <h3>
 * direct na de <h1> van de pagina slaat een niveau over.
 */
export function UspBar() {
  return (
    <section aria-label="Onze voorwaarden" className="bg-antraciet text-kastwit">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {usps.map(({ Icoon, kop, regel, kort, accent }) => (
            <li
              key={kop}
              className="group relative overflow-hidden rounded-2xl bg-antraciet-verhoogd p-4 ring-1 ring-kastwit/10 transition-shadow sm:p-5 lg:p-6"
            >
              {/* Haarlijn in de accentkleur: genoeg om de tegels uit
                  elkaar te houden, te weinig om te schreeuwen. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ backgroundColor: accent }}
              />

              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl sm:h-11 sm:w-11"
                style={{
                  color: accent,
                  backgroundColor: "color-mix(in srgb, currentColor 14%, transparent)",
                }}
              >
                <Icoon className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>

              <p className="mt-3 text-[13px] font-medium leading-snug sm:mt-4 sm:text-sm">
                {kop}
              </p>

              {/* Kort op smal, volledig vanaf tablet. */}
              <p className="mt-1 text-[11px] leading-relaxed text-kastwit/55 sm:hidden">
                {kort}
              </p>
              <p className="mt-1.5 hidden text-xs leading-relaxed text-kastwit/55 sm:block">
                {regel}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
