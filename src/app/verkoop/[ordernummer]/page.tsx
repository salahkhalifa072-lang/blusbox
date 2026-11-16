import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { vereisVerkoper } from "@/lib/sessie";
import { haalDeurverkoop } from "@/db/deurverkoop";
import { euro } from "@/lib/pricing";
import { siteUrl } from "@/lib/site";
import { annuleerVerkoop, vernieuwBetaling } from "../acties";
import { Betaalstatus } from "./betaalstatus";

/**
 * Het betaalscherm aan de deur.
 *
 * De QR-code wijst naar een korte link op blusbox.nl en niet rechtstreeks
 * naar Stripe: een Stripe-url is honderden tekens lang en dat geeft een
 * dichte code die een oudere telefoon in het halfdonker niet leest. De
 * korte link stuurt door naar de betaalpagina die op dat moment open staat.
 */
export default async function Betaalscherm({ params }: { params: Promise<{ ordernummer: string }> }) {
  const actor = await vereisVerkoper();
  const { ordernummer } = await params;
  const v = await haalDeurverkoop(decodeURIComponent(ordernummer), actor);
  if (!v) notFound();

  const link = v.betaaltoken ? `${siteUrl}/b/${v.betaaltoken}` : null;
  const qr =
    link && v.status === "nieuw"
      ? await QRCode.toString(link, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#16181a", light: "#ffffff" } })
      : null;

  return (
    <>
      <Link href="/verkoop" className="data text-xs text-staal-tekst underline underline-offset-4">
        ← Mijn verkopen
      </Link>

      <div className="mt-3 rounded-3xl bg-kastwit p-5">
        <p className="data text-[11px] uppercase tracking-widest text-staal-tekst">{v.ordernummer}</p>
        <h1 className="font-display mt-1 text-4xl">{euro(v.totaalInclBtwCenten)}</h1>
        {v.kortingCenten > 0 && (
          <p className="data text-xs text-staal-tekst">inclusief {euro(v.kortingCenten)} korting</p>
        )}
        <p className="mt-1 text-sm text-staal-tekst">
          {v.klantNaam} · {v.adres}
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {v.regels.map((r) => (
            <li key={r.naam} className="flex justify-between gap-3">
              <span>{r.aantal} × {r.naam}</span>
              <span className="data">{euro(r.regelInclBtwCenten)}</span>
            </li>
          ))}
        </ul>
      </div>

      <Betaalstatus ordernummer={v.ordernummer} beginstatus={v.status} email={v.email}>
        {qr && link && (
          <div className="mt-4 rounded-3xl bg-kastwit p-5 text-center">
            <p className="text-sm font-medium">Laat de klant deze code scannen met de camera</p>
            <div
              className="mx-auto mt-3 w-full max-w-[17rem] [&_svg]:h-auto [&_svg]:w-full"
              // QRCode levert een kale svg zonder scripts; veilig om in te voegen.
              dangerouslySetInnerHTML={{ __html: qr }}
            />
            <p className="mt-3 text-xs text-staal-tekst">
              Betalen kan met iDEAL in de bank-app, Apple Pay, Google Pay of een betaalpas/creditcard.
            </p>
            <a
              href={link}
              target="_blank"
              rel="noopener"
              className="mt-4 inline-block rounded-full border border-antraciet px-5 py-2.5 text-sm"
            >
              Betaalpagina op deze telefoon openen
            </a>
          </div>
        )}
        {/* Binnen het wachtscherm: na de betaling verdwijnen ze vanzelf. */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <form action={vernieuwBetaling}>
            <input type="hidden" name="ordernummer" value={v.ordernummer} />
            <button type="submit" className="w-full rounded-full border border-railstaal bg-kastwit px-4 py-3 text-sm">
              Nieuwe betaalcode
            </button>
          </form>
          <form action={annuleerVerkoop}>
            <input type="hidden" name="ordernummer" value={v.ordernummer} />
            <button type="submit" className="w-full rounded-full border border-blusrood-op-licht/50 bg-kastwit px-4 py-3 text-sm text-blusrood-op-licht">
              Klant ziet ervan af
            </button>
          </form>
        </div>
      </Betaalstatus>

    </>
  );
}
