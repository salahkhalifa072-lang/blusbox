import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { LogoBadge } from "@/components/site/logo";
import { MODULE_PAKKET } from "@/lib/verzending";

/**
 * De module in de hand en in de kast.
 *
 * De rest van de homepage is donker, technisch en zonder mensen — dat past
 * bij het onderwerp, maar het laat één vraag onbeantwoord: hoe groot is dat
 * ding nou eigenlijk en waar komt het te hangen. Twee foto's met een hand
 * en een meterkast erbij doen dat in één oogopslag, en daar is geen tekst
 * tegen opgewassen.
 *
 * De achtergrond is antraciet omdat de secties ervoor en erna allebei
 * licht zijn — twee lichte blokken naast elkaar lopen in elkaar over en
 * dan leest de pagina als één lange lap. Bijkomend voordeel: warme foto's
 * met veel wit erin komen op donker los te staan als in een galerij.
 *
 * De maten komen uit MODULE_PAKKET en worden niet overgetypt — die staan
 * ook in de specificatietabel, en twee plekken met hetzelfde getal lopen
 * vroeg of laat uit de pas.
 */

type Beeld = {
  src: string;
  alt: string;
  kop: string;
  tekst: string;
};

export function InDePraktijk() {
  const { lengteCm, breedteCm, hoogteCm } = MODULE_PAKKET;

  const beelden: Beeld[] = [
    {
      src: "/media/module-in-hand.webp",
      alt: "Twee handen houden de rode Blusbox-module vast, met aan weerszijden het lichtblauwe detectiekoord",
      kop: "Past in één hand",
      tekst: `${lengteCm} × ${breedteCm} × ${hoogteCm} cm en 30 gram. Twee modulebreedtes op de rail — je raakt geen enkele groep kwijt.`,
    },
    {
      src: "/media/meterkast-geplaatst.webp",
      alt: "Geopende meterkast met groepenkast en kWh-meter; tussen de installatieautomaten zit de rode Blusbox-module op de DIN-rail",
      kop: "Klikt tussen je groepen",
      tekst:
        "Op de DIN-rail naast je hoofdschakelaar en aardlekschakelaar. Geen bedrading, geen aansluiting, geen boren.",
    },
  ];

  return (
    <section className="bg-antraciet py-20 text-kastwit sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="data text-xs uppercase tracking-widest text-railstaal">
            in de praktijk
          </p>
          <h2 className="font-display mt-3 max-w-3xl text-[clamp(2rem,5vw,3.5rem)]">
            Zo klein.
            <span className="accent"> Zo geplaatst.</span>
          </h2>
          <p className="mt-4 max-w-xl text-kastwit/70">
            Geen installateur die een dag over de vloer moet, geen kabel die
            ergens vandaan moet komen. De module klikt op de rail en doet
            daarna tien jaar lang niets — tot het moet.
          </p>
        </Reveal>

        {/* Op mobiel onder elkaar, en daar staat de beeldverhouding op 4:5
            in plaats van 2:3: staand beeld op volle breedte vult anders
            bijna een heel telefoonscherm, en dan scrol je door foto's in
            plaats van door de pagina.

            Vanaf sm ongelijke kolommen, met het tweede beeld iets lager.
            Het zijn twee portretten van dezelfde man in vrijwel dezelfde
            houding; even groot en op één lijn lezen ze als een dubbeling.
            Verspringend worden het twee momenten van hetzelfde verhaal. */}
        <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-[1.15fr_1fr] sm:items-start sm:gap-8">
          {beelden.map((b, i) => (
            <Reveal key={b.src} delay={i * 90} className={i === 1 ? "sm:mt-16" : undefined}>
              <figure>
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-antraciet-verhoogd sm:aspect-[2/3]">
                  <Image
                    src={b.src}
                    alt={b.alt}
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                  <LogoBadge />
                </div>
                <figcaption className="px-1 pt-4">
                  <p className="font-display text-xl">{b.kop}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-kastwit/65">
                    {b.tekst}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <p className="data mt-8 text-xs text-railstaal">
          Beeld is een weergave.
        </p>
      </div>
    </section>
  );
}
