import { ImageResponse } from "next/og";
import { siteUrl } from "@/lib/site";
import {
  adviesprijs,
  prijsIncl,
  KORTINGSPERCENTAGE,
  TOON_ADVIESPRIJS,
} from "@/lib/pricing";

/**
 * Bannerbeelden voor affiliates, ter plekke gegenereerd.
 *
 * Geen losse PNG's die iemand downloadt en op zijn eigen site zet. Dat
 * werkt precies één keer goed: zodra de prijs verandert hangen er
 * tientallen banners in het wild met een bedrag dat niet meer klopt, en
 * die krijg je nooit meer teruggehaald. Hier komt de prijs uit
 * lib/pricing, dus hij klopt overal tegelijk. Bijkomend voordeel: het
 * ontwerp is later aan te passen zonder dat affiliates iets vervangen.
 *
 * Vier standaard IAB-formaten, zodat ze in bestaande advertentieblokken
 * passen zonder gedoe.
 *
 * Elk formaat heeft een eigen indeling en niet één die meeschaalt. Een
 * banner van 160 bij 600 en een van 728 bij 90 hebben niets gemeen; ze
 * door dezelfde opmaak persen levert bij allebei iets half werkends op.
 */

export const runtime = "nodejs";
export const revalidate = 86400;

const FORMATEN = {
  "728x90": { breedte: 728, hoogte: 90 },
  "300x250": { breedte: 300, hoogte: 250 },
  "160x600": { breedte: 160, hoogte: 600 },
  "320x100": { breedte: 320, hoogte: 100 },
} as const;

type FormaatSleutel = keyof typeof FORMATEN;

const K = {
  antraciet: "#16181a",
  verhoogd: "#1f2225",
  kastwit: "#e8e9e6",
  railstaal: "#9ba1a6",
  blusrood: "#d2231f",
  vlak: "#b81e1b",
};

/**
 * Anton, de letter van de site.
 *
 * Satori kent geen webfonts; het bestand moet als buffer mee. Eén keer
 * ophalen en vasthouden — per vertoning naar Google gaan maakt de banner
 * traag en afhankelijk van hun uptime. Mislukt het, dan valt hij terug op
 * de standaardletter: een banner in de verkeerde letter is vervelend,
 * geen banner is erger.
 */
let antonCache: ArrayBuffer | null | undefined;

async function haalAnton(): Promise<ArrayBuffer | null> {
  if (antonCache !== undefined) return antonCache ?? null;
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Anton&display=swap",
      { headers: { "User-Agent": "Mozilla/5.0" } },
    ).then((r) => r.text());
    const url = css.match(/url\(([^)]+)\)\s*format\('(truetype|opentype)'\)/)?.[1];
    antonCache = url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    antonCache = null;
  }
  return antonCache ?? null;
}

/* ------------------------------------------------------- bouwstenen */

function Merk({
  maat,
  letter,
  logo,
}: {
  maat: number;
  letter?: string;
  logo: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: maat * 0.28 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} width={maat} height={maat} alt="" />
      <span
        style={{ fontFamily: letter, fontSize: maat * 0.72, letterSpacing: 0.4 }}
      >
        BLUSBOX
      </span>
    </div>
  );
}

function Prijs({ maat, letter }: { maat: number; letter?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: maat * 0.22 }}>
      <span
        style={{
          fontFamily: letter,
          fontSize: maat,
          color: K.kastwit,
          lineHeight: 1,
        }}
      >
        {prijsIncl}
      </span>
      {TOON_ADVIESPRIJS && (
        <>
          <span
            style={{
              fontSize: maat * 0.42,
              color: K.railstaal,
              textDecoration: "line-through",
            }}
          >
            {adviesprijs}
          </span>
          <span
            style={{
              display: "flex",
              backgroundColor: K.vlak,
              color: K.kastwit,
              fontSize: maat * 0.34,
              padding: `${Math.round(maat * 0.08)}px ${Math.round(maat * 0.24)}px`,
              borderRadius: 999,
            }}
          >
            −{KORTINGSPERCENTAGE}%
          </span>
        </>
      )}
    </div>
  );
}

function Knop({ maat }: { maat: number }) {
  return (
    <div
      style={{
        display: "flex",
        backgroundColor: K.vlak,
        color: K.kastwit,
        fontSize: maat,
        padding: `${Math.round(maat * 0.62)}px ${Math.round(maat * 1.3)}px`,
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      Bekijk Blusbox
    </div>
  );
}

/**
 * Het product als afloop aan de rand.
 *
 * Absoluut geplaatst, zodat het beeld doorloopt tot over de rand. In de
 * normale stroom meegeven kostte bij 300 bij 250 zo veel hoogte dat prijs
 * en knop erbuiten vielen — en dat zie je pas als je de banner bekijkt,
 * want overlopende inhoud geeft geen foutmelding.
 */
function Afloop({
  breedte,
  hoogte,
  kant,
  product,
}: {
  breedte: number;
  hoogte: number;
  kant: "rechts" | "onder";
  product: string;
}) {
  const plaats =
    kant === "rechts"
      ? { top: 0, right: 0 }
      : { bottom: 0, left: 0 };

  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        overflow: "hidden",
        backgroundColor: K.verhoogd,
        width: breedte,
        height: hoogte,
        ...plaats,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product}
        width={breedte}
        height={hoogte}
        style={{ objectFit: "cover" }}
        alt=""
      />
    </div>
  );
}

/* ------------------------------------------------------------ route */

export async function GET(
  request: Request,
  context: { params: Promise<{ formaat: string }> },
) {
  const { formaat } = await context.params;
  if (!(formaat in FORMATEN)) {
    return new Response("Onbekend formaat", { status: 404 });
  }
  const maat = FORMATEN[formaat as FormaatSleutel];

  const anton = await haalAnton();
  const letter = anton ? "Anton" : undefined;

  /*
   * Beelden van het adres waar dit verzoek binnenkwam, niet van een vaste
   * siteUrl: anders haalt een preview of een lokale server ze bij
   * productie, en ontbreken ze zolang een nieuw bestand daar nog niet staat.
   */
  const basis = new URL(request.url).origin || siteUrl;
  const logo = `${basis}/icon.png`;
  // JPEG en geen WebP: de beeldgenerator leest WebP niet, en dan verdwijnt
  // de foto zonder foutmelding uit de banner.
  const product = `${basis}/media/module-packshot.jpg`;

  const omhulsel = {
    width: maat.breedte,
    height: maat.hoogte,
    position: "relative" as const,
    display: "flex" as const,
    backgroundColor: K.antraciet,
    color: K.kastwit,
    borderTop: `3px solid ${K.blusrood}`,
    overflow: "hidden" as const,
    fontFamily: letter,
  };

  let inhoud: React.ReactElement;

  if (formaat === "728x90") {
    inhoud = (
      <div style={{ ...omhulsel, alignItems: "center", paddingLeft: 20, gap: 20 }}>
        <Afloop breedte={140} hoogte={maat.hoogte} kant="rechts" product={product} />
        <Merk maat={26} letter={letter} logo={logo} />
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <span style={{ fontFamily: letter, fontSize: 21, lineHeight: 1.05 }}>
            BRAND IN DE METERKAST?
          </span>
          <span style={{ fontSize: 11, color: K.railstaal, marginTop: 2 }}>
            Blusbox dooft hem bij 170 °C. Zonder stroom.
          </span>
        </div>
        <Prijs maat={24} letter={letter} />
        <div style={{ display: "flex", marginRight: 150 }}>
          <Knop maat={11} />
        </div>
      </div>
    );
  } else if (formaat === "320x100") {
    inhoud = (
      <div style={{ ...omhulsel, alignItems: "center", paddingLeft: 14, gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <Merk maat={17} letter={letter} logo={logo} />
          <span
            style={{ fontFamily: letter, fontSize: 15, marginTop: 4, lineHeight: 1.05 }}
          >
            BRAND IN DE METERKAST?
          </span>
          <div style={{ display: "flex", marginTop: 5 }}>
            <Prijs maat={16} letter={letter} />
          </div>
        </div>
        <div style={{ display: "flex", marginRight: 12 }}>
          <Knop maat={10} />
        </div>
      </div>
    );
  } else if (formaat === "300x250") {
    inhoud = (
      <div style={{ ...omhulsel, flexDirection: "column", padding: 16 }}>
        <Afloop breedte={maat.breedte} hoogte={76} kant="onder" product={product} />
        <Merk maat={22} letter={letter} logo={logo} />
        <span
          style={{ fontFamily: letter, fontSize: 26, lineHeight: 1.05, marginTop: 10 }}
        >
          BRAND IN DE METERKAST?
        </span>
        <span
          style={{ fontSize: 11, color: K.railstaal, marginTop: 4, lineHeight: 1.3 }}
        >
          Blusbox dooft hem bij 170 °C, zonder stroom.
        </span>
        <div style={{ display: "flex", marginTop: 10 }}>
          <Prijs maat={26} letter={letter} />
        </div>
        <div style={{ display: "flex", marginTop: 8 }}>
          <Knop maat={11} />
        </div>
      </div>
    );
  } else {
    // 160x600 — staande wolkenkrabber
    inhoud = (
      <div style={{ ...omhulsel, flexDirection: "column", padding: 14 }}>
        {/* Ruim bemeten: met een lage strook bleef er een dood gat tussen
            de knop en de foto. Bij 600 pixels hoogte valt zo'n leegte
            meteen op. */}
        <Afloop breedte={maat.breedte} hoogte={300} kant="onder" product={product} />
        <Merk maat={19} letter={letter} logo={logo} />
        <span
          style={{ fontFamily: letter, fontSize: 23, lineHeight: 1.06, marginTop: 16 }}
        >
          BRAND IN DE METERKAST?
        </span>
        <span
          style={{ fontSize: 11, color: K.railstaal, marginTop: 8, lineHeight: 1.35 }}
        >
          Blusbox dooft hem bij 170 °C. Zonder stroom, zonder dat er iemand
          thuis is.
        </span>
        <div style={{ display: "flex", marginTop: 18 }}>
          <Prijs maat={24} letter={letter} />
        </div>
        <div style={{ display: "flex", marginTop: 14 }}>
          <Knop maat={11} />
        </div>
      </div>
    );
  }

  return new ImageResponse(inhoud, {
    width: maat.breedte,
    height: maat.hoogte,
    fonts: anton
      ? [{ name: "Anton", data: anton, style: "normal", weight: 400 }]
      : undefined,
  });
}
