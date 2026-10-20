/**
 * Verwachte leverdatum: twee werkdagen na de bestelling. Dat is de bovenkant
 * van wat we beloven (vóór 16:00 vandaag verstuurd, 1–2 werkdagen bezorging);
 * Google mailt de enquête kort na deze datum, dus liever iets te laat dan
 * vóór het pakket er is.
 */
export function verwachteLeverdatum(besteld: Date): string {
  const d = new Date(besteld);
  let werkdagen = 0;
  while (werkdagen < 2) {
    d.setDate(d.getDate() + 1);
    const dag = d.getDay();
    if (dag !== 0 && dag !== 6) werkdagen++;
  }
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(d);
}
