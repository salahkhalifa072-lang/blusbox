import { NextResponse } from "next/server";
import { wagenAantal } from "@/lib/winkelwagen-cookie";

/** Cart count for the header badge. Never cached — it is per-visitor. */
export async function GET() {
  const aantal = await wagenAantal();
  return NextResponse.json(
    { aantal },
    { headers: { "Cache-Control": "no-store" } },
  );
}
