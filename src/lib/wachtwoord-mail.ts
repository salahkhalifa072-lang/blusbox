import { bedrijf } from "@/lib/bedrijf";
import { siteUrl } from "@/lib/site";
import { verstuurMail, type MailResultaat } from "@/lib/mailtransport";
import { GELDIGHEID_MINUTEN, herstelUrl } from "@/lib/wachtwoord-herstel";

/**
 * De herstelmail.
 *
 * Sober en kort, met de link voluit in de tekst in plaats van achter een
 * knop. Dat is hier geen smaakkwestie: een knop waarvan je de bestemming
 * niet ziet is precies wat phishing doet, en deze mail vraagt iemand om
 * een wachtwoord in te typen. Een leesbare link naar het eigen domein is
 * wat een ontvanger kan controleren voordat hij klikt.
 *
 * Geen e-mailadres en geen redirect in de URL — zie lib/wachtwoord-herstel.ts
 * voor waarom die vorm eerder een phishingwaarschuwing in Chrome opleverde.
 */
export async function stuurHerstelmail(opts: {
  naar: string;
  naam: string | null;
  token: string;
}): Promise<MailResultaat> {
  const link = herstelUrl(siteUrl, opts.token);
  const aanhef = opts.naam ? `Hoi ${opts.naam},` : "Hoi,";

  const tekst = [
    aanhef,
    "",
    "Je hebt gevraagd om je wachtwoord opnieuw in te stellen. Open deze link:",
    "",
    link,
    "",
    `De link werkt ${GELDIGHEID_MINUTEN} minuten en daarna niet meer. Hij kan één keer gebruikt worden.`,
    "",
    "Heb je dit niet aangevraagd, dan hoef je niets te doen. Je wachtwoord blijft dan zoals het was.",
    "",
    bedrijf.volledig,
  ].join("\n");

  const html = `<!doctype html><html lang="nl"><body style="margin:0;padding:24px 0;background:#e8e9e6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#ffffff;padding:32px">
<p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5f666b">Blusbox</p>
<h1 style="margin:8px 0 20px;font-size:22px;line-height:1.25;color:#16181a">Je wachtwoord opnieuw instellen</h1>
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#16181a">${aanhef}</p>
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#16181a">Je hebt gevraagd om je wachtwoord opnieuw in te stellen. Open deze link:</p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.6"><a href="${link}" style="font-family:ui-monospace,Menlo,monospace;color:#b81e1b;word-break:break-all">${link}</a></p>
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#16181a">De link werkt ${GELDIGHEID_MINUTEN} minuten en kan één keer gebruikt worden.</p>
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#16181a">Heb je dit niet aangevraagd, dan hoef je niets te doen. Je wachtwoord blijft dan zoals het was.</p>
<hr style="border:0;border-top:1px solid #9ba1a6;margin:28px 0 16px">
<p style="margin:0;font-size:13px;color:#5f666b">${bedrijf.volledig}</p>
<p style="margin:0;font-size:13px;color:#5f666b">${bedrijf.telefoon} · ${bedrijf.email}</p>
</div></body></html>`;

  return verstuurMail({
    naar: opts.naar,
    onderwerp: "Je wachtwoord opnieuw instellen",
    html,
    tekst,
  });
}
