import Image from "next/image";
import { SectieLabel } from "@/components/ui/sectielabel";
import { Reveal } from "@/components/ui/reveal";
import { gratisVerzending } from "@/lib/pricing";
import { VideoBlock } from "@/components/ui/video-block";

/**
 * Van bestellen tot tien jaar rust, in vier stappen.
 *
 * Wie twijfelt, twijfelt meestal niet over het product maar over het
 * gedoe: moet er een installateur komen, hoe lang duurt het. Dit blok
 * beantwoordt dat vóórdat de vraag opkomt.
 *
 * De labels op de kaarten zijn beloftes die elders op de site al staan
 * (productpagina, veelgestelde vragen). Er komt hier niets nieuws bij:
 * een stap met een tijd die we niet waarmaken, kost meer dan hij oplevert.
 *
 * De beelden zijn echt en door de eigenaar per stap gekozen; de video
 * is uit twee opnames gemonteerd (de mislukte eerste poging in de tweede
 * opname is eruit geknipt).
 */

type Beeld =
  | { soort: "foto"; src: string; alt: string }
  | { soort: "video"; src: string; poster: string; alt: string };

const stappen: { label: string; kop: string; tekst: string; beeld: Beeld }[] = [
  {
    label: "Vóór 16:00 besteld",
    kop: "Bestel je Blusbox",
    tekst: "Vandaag besteld vóór 16:00, vandaag de deur uit.",
    beeld: {
      soort: "foto",
      src: "/media/echt/stap1-bestellen.jpg",
      alt: "Blusbox-doos met de rode blusmodule en het blauwe detectiekoord ernaast op tafel",
    },
  },
  {
    label: "Doorgaans 1 werkdag",
    kop: "Gratis thuisbezorgd",
    tekst: `${gratisVerzending.kort}, zonder minimumbedrag. Alles zit in de doos.`,
    beeld: {
      soort: "foto",
      src: "/media/echt/stap2-bezorgd.jpg",
      alt: "Man bij zijn meterkast met de Blusbox-doos in de ene hand en de module in de andere",
    },
  },
  {
    label: "Geen aansluiting",
    kop: "Klik hem op de DIN-rail",
    tekst: "Naast je hoofdschakelaar. Geen bedrading, geen stroom, geen batterij.",
    beeld: {
      soort: "video",
      src: "/media/echt/plaatsen.mp4",
      poster: "/media/echt/plaatsen.jpg",
      alt: "Opname: de Blusbox wordt in een meterkast op de DIN-rail geklikt en het detectiekoord wordt langs de groepen gelegd",
    },
  },
  {
    label: "10 jaar",
    kop: "Tien jaar bescherming",
    tekst: "Grijpt zelf in bij 170 °C. Je krijgt bericht voordat de termijn afloopt.",
    beeld: {
      soort: "foto",
      src: "/media/echt/stap4-beschermd.jpg",
      alt: "Tevreden man voor zijn meterkast waarin de Blusbox is geplaatst",
    },
  },
];

export function ZoWerktHet() {
  return (
    <section className="py-14 sm:py-24" aria-labelledby="zo-werkt-het-kop">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <SectieLabel>zo werkt het</SectieLabel>
              <h2
                id="zo-werkt-het-kop"
                className="font-display mt-4 max-w-2xl text-[clamp(2rem,5vw,3.5rem)]"
              >
                Besteld, geklikt, <span className="accent">beschermd</span>
              </h2>
            </div>
            <p className="max-w-sm text-sm text-staal-tekst">
              Geen installateur nodig om hem aan te sluiten, want er valt niets
              aan te sluiten.
            </p>
          </div>
        </Reveal>

        {/* Op mobiel vegen, vanaf tablet een raster: vier hoge kaarten
            onder elkaar kosten op een telefoon vier schermen. */}
        <ol className="-mx-6 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {stappen.map((s, i) => (
            <li key={s.kop} className="w-[78%] shrink-0 snap-start sm:w-auto">
              <Reveal delay={i * 70} className="h-full">
                <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-kastwit-dim">
                  <div className="flex items-center gap-2 p-5 pb-0">
                    <span className="data rounded-full bg-kastwit px-2.5 py-1 text-[11px]">
                      Stap {i + 1}
                    </span>
                    <span className="data rounded-full bg-antraciet px-2.5 py-1 text-[11px] text-kastwit">
                      {s.label}
                    </span>
                  </div>
                  <h3 className="mt-4 px-5 text-lg font-medium leading-snug">{s.kop}</h3>
                  <p className="mt-2 px-5 text-sm leading-relaxed text-staal-tekst">{s.tekst}</p>
                  {/* Staand formaat: de opnames zijn staand, en bij 4:3
                      viel de meterkast boven of onder buiten beeld. */}
                  <div className="relative mt-5 aspect-[4/5] flex-none overflow-hidden sm:mt-auto">
                    {s.beeld.soort === "video" ? (
                      <VideoBlock
                        src={s.beeld.src}
                        poster={s.beeld.poster}
                        label={s.beeld.alt}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={s.beeld.src}
                        alt={s.beeld.alt}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 78vw"
                        className="object-cover object-[50%_35%]"
                      />
                    )}
                    {s.beeld.soort === "video" && (
                      <span className="data absolute bottom-3 left-3 rounded-full bg-antraciet/80 px-2.5 py-1 text-[10px] uppercase tracking-widest text-kastwit backdrop-blur">
                        echte opname
                      </span>
                    )}
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
