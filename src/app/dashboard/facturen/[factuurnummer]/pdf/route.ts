import { NextResponse } from "next/server";
import { vereisDashboard } from "@/lib/sessie";
import { magFactureren, vereis } from "@/lib/rollen";
import { haalFactuur } from "@/db/facturen";
import { factuurPdf } from "@/lib/mail";

export const dynamic = "force-dynamic";

/** De factuur als pdf, voor de eigen administratie. */
export async function GET(
  _verzoek: Request,
  { params }: { params: Promise<{ factuurnummer: string }> },
) {
  const actor = await vereisDashboard();
  vereis(magFactureren(actor.rol), "facturen inzien");

  const { factuurnummer } = await params;
  const factuur = await haalFactuur({ factuurnummer });
  if (!factuur) return new NextResponse("Niet gevonden", { status: 404 });

  const resultaat = await factuurPdf(factuur);
  if ("fout" in resultaat) {
    return new NextResponse(resultaat.fout, { status: 500 });
  }

  return new NextResponse(Buffer.from(resultaat.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="factuur-${factuur.factuurnummer}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
