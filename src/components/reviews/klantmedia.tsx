import Image from "next/image";
import { VideoBlock } from "@/components/ui/video-block";
import { KLANTMEDIA } from "@/lib/klantmedia";

/**
 * Wat klanten zelf hebben vastgelegd.
 *
 * Staat onder de beoordelingen omdat het die onderbouwt: een tekst zegt
 * dat iemand tevreden is, een foto van zijn eigen meterkast laat zien dat
 * het ding er ook echt in hangt. Dat is het enige bewijs op deze pagina
 * dat een bezoeker zelf kan nalopen.
 *
 * De video eerst en over twee kolommen. Van al het materiaal is dat het
 * enige dat de vraag beantwoordt die iemand vlak voor het bestellen
 * stelt — hoeveel werk is dit — en dan moet hij niet onderaan staan.
 *
 * Twee kolommen op mobiel, want dit zijn detailopnames van een kast: op
 * volle breedte is één foto al een half scherm en scrolt niemand de reeks
 * uit.
 */
export function Klantmedia() {
  if (KLANTMEDIA.length === 0) return null;

  return (
    <div className="mt-14">
      <h3 className="font-display text-xl">Geïnstalleerd bij klanten</h3>
      <p className="mt-1.5 max-w-xl text-sm text-staal-tekst">
        Foto&apos;s en beeld uit meterkasten waar de module inmiddels hangt,
        gemaakt door de klanten zelf.
      </p>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {KLANTMEDIA.map((m, i) => (
          <li
            key={m.src}
            className={
              m.soort === "video"
                ? "col-span-2 row-span-2"
                : undefined
            }
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-kastwit">
              {m.soort === "video" ? (
                <VideoBlock
                  src={m.src}
                  poster={m.poster}
                  label={m.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={m.src}
                  alt={m.alt}
                  fill
                  // Vier kolommen vanaf sm, twee daaronder — dat is wat de
                  // browser moet weten om niet een veel te groot bestand op
                  // een telefoon binnen te halen.
                  sizes="(min-width: 640px) 25vw, 50vw"
                  loading={i < 3 ? "eager" : "lazy"}
                  className="object-cover"
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
