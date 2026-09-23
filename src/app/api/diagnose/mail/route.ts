import { NextResponse } from "next/server";
import { bestelmeldingAdres, stuurBestelmelding } from "@/lib/mail";
import { contactadresVanBestelling } from "@/db/queries";
import { afzender, verstuurMail } from "@/lib/mailtransport";

/**
 * Diagnose van het mailkanaal in productie.
 *
 * Bestaat omdat twee betaalde bestellingen geen enkele mail opleverden en
 * van buitenaf niet te zien was waaróm: een geweigerde API-aanroep laat bij
 * MailerSend geen bericht achter, dus een ontbrekend token en een ongeldig
 * token zien er van een afstand identiek uit. Raden kost dan een echte
 * bestelling; meten kost één verzoek.
 *
 * Twee sloten. De route bestaat niet zolang DIAGNOSE_SLEUTEL niet gezet is
 * — dan geeft hij 404 en verraadt hij ook niet dát hij er is. Staat de
 * sleutel er wel, dan moet die exact meegegeven worden.
 *
 * Verstuurt uitsluitend naar het eigen bestelmeldingsadres, nooit naar een
 * adres uit het verzoek: anders is dit een open relay waarmee iemand post
 * namens blusbox.nl de wereld in stuurt.
 *
 * Het token zelf komt hier nooit in het antwoord; alleen de lengte, zodat
 * een afgekapte of leeggelaten waarde zichtbaar wordt.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sleutel = process.env.DIAGNOSE_SLEUTEL;
  if (!sleutel) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const gegeven = new URL(request.url).searchParams.get("sleutel");
  if (gegeven !== sleutel) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const token = process.env.MAILERSEND_API_TOKEN ?? "";
  const naar = bestelmeldingAdres();

  const stand = {
    tokenAanwezig: token.length > 0,
    tokenLengte: token.length,
    tokenAsciiSchoon: [...token].every((c) => c.charCodeAt(0) <= 127),
    afzender: afzender(),
    bestelmeldingAdres: naar ?? null,
  };

  if (!token || !naar) {
    return NextResponse.json({ ok: false, stand, verzonden: null });
  }

  // Met ?bestelling=BB-... gaat de échte bestelmelding eruit voor een
  // bestaande bestelling. Dat loopt door dezelfde functie die de webhook
  // aanroept en leest dezelfde database, dus het bewijst het hele pad —
  // niet alleen dat er een mail de deur uit kan.
  //
  // De ontvanger blijft het eigen bestelmeldingsadres; het ordernummer
  // kiest alleen wélke bestelling erin staat. Er gaat hier nooit post naar
  // een klant, hoe het verzoek er ook uitziet.
  const bestelling = new URL(request.url).searchParams.get("bestelling");

  // ?kijk=1 stuurt niets en zegt alleen welk klantadres bij de bestelling
  // gevonden wordt. Het verzendbericht en het bezorgbericht zoeken dat adres
  // in de database op en niet bij Stripe; staat het er niet, dan klikt de
  // winkelier op "verzonden" en vertrekt er stilletjes niets.
  if (bestelling && new URL(request.url).searchParams.get("kijk")) {
    const klantadres = await contactadresVanBestelling(bestelling);
    return NextResponse.json({
      ok: Boolean(klantadres),
      stand,
      bestelling,
      klantadres,
      verzonden: null,
    });
  }

  if (bestelling) {
    const resultaat = await stuurBestelmelding(bestelling);
    return NextResponse.json({
      ok: resultaat.verstuurd,
      stand,
      bestelling,
      verzonden: resultaat,
    });
  }

  const resultaat = await verstuurMail({
    naar,
    onderwerp: "Blusbox — diagnose mailkanaal productie",
    tekst:
      "Deze mail komt uit de productieomgeving van blusbox.nl. " +
      "Als je hem ziet, werkt het verzendkanaal daar en komen bestelmeldingen aan.",
    html:
      "<p>Deze mail komt uit de productieomgeving van blusbox.nl. " +
      "Als je hem ziet, werkt het verzendkanaal daar en komen bestelmeldingen aan.</p>",
  });

  return NextResponse.json({ ok: resultaat.verstuurd, stand, verzonden: resultaat });
}
