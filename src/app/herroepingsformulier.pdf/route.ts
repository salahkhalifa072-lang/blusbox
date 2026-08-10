import { maakHerroepingsformulier } from "@/lib/herroepingsformulier";

/**
 * Serves the statutory model withdrawal form as a PDF (§8).
 *
 * Generated on request rather than committed as a binary, so the trader
 * details always match the ones in the codebase. It is a static document,
 * so it is cached hard at the edge.
 */
export async function GET() {
  const pdf = await maakHerroepingsformulier();

  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'inline; filename="modelformulier-herroeping-blusbox.pdf"',
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
