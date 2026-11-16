import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { sessieStand } from "@/lib/stripe";
import { siteUrl } from "@/lib/site";

/**
 * Korte link achter de QR-code van een deurverkoop: stuurt door naar de
 * betaalpagina die nu open staat. Het token is willekeurig en niet te
 * raden; het ordernummer zou dat wel zijn.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [order] = await db
    .select({ status: orders.status, sessie: orders.mollieId })
    .from(orders)
    .where(and(eq(orders.betaaltoken, token), sql`${orders.verkoperId} is not null`))
    .limit(1);

  if (order?.status === "geleverd") return NextResponse.redirect(`${siteUrl}/betaald`);
  if (!order || order.status !== "nieuw" || !order.sessie) {
    return NextResponse.redirect(`${siteUrl}/betaald?verlopen=1`);
  }
  try {
    const stand = await sessieStand(order.sessie);
    if (stand.open) return NextResponse.redirect(stand.url);
    return NextResponse.redirect(`${siteUrl}/betaald${stand.betaald ? "" : "?verlopen=1"}`);
  } catch (fout) {
    console.error("Betaallink deurverkoop:", fout);
    return NextResponse.redirect(`${siteUrl}/betaald?verlopen=1`);
  }
}
