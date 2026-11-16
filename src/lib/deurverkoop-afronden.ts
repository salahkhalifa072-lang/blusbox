import { haalBestelling } from "./bestelling";
import { stuurDeurverkoopFactuur, stuurFactuurKopie, stuurTrustpilotUitnodiging } from "./mail";
export { CONTANT_VOORVOEGSEL, isContant } from "./contant";

/**
 * Wat er na een betaalde deurverkoop gebeurt, voor kaart en contant gelijk:
 * factuur als voldaan met bedenktijd en herroepingsformulier naar de klant,
 * kopie naar de eigen administratie, Trustpilot-uitnodiging.
 *
 * Bij contant staat in de kopie wie het geld heeft: dat bedrag moet de
 * eigenaar nog met de verkoper verrekenen, en zonder die regel valt het
 * verschil pas bij de boekhouding op.
 *
 * Gooit nooit: de betaling is rond, een mislukte mail wordt gelogd.
 */
export async function rondDeurverkoopAf(
  ordernummer: string,
  contant?: { verkoper: string },
): Promise<void> {
  const gegevens = await haalBestelling(ordernummer).catch(() => null);
  const factuurnummer = gegevens?.order.factuurnummer;
  if (!factuurnummer) {
    console.error(`Deurverkoop ${ordernummer} betaald maar zonder factuurnummer.`);
    return;
  }
  const notitie = contant
    ? `CONTANT ontvangen door ${contant.verkoper}. Nog verrekenen met de verkoper.`
    : undefined;
  const [klant, kopie] = await Promise.allSettled([
    stuurDeurverkoopFactuur(factuurnummer),
    stuurFactuurKopie(factuurnummer, notitie),
  ]);
  for (const [wat, r] of [["Factuurmail", klant], ["Factuurkopie", kopie]] as const) {
    if (r.status === "rejected") console.error(`${wat} ${factuurnummer} gooide:`, r.reason);
    else if (!r.value.verstuurd) console.error(`${wat} ${factuurnummer} niet verstuurd: ${r.value.reden}`);
  }
  await stuurTrustpilotUitnodiging(ordernummer).catch((fout: unknown) =>
    console.error(`Trustpilot-uitnodiging ${ordernummer} mislukt:`, fout),
  );
}
