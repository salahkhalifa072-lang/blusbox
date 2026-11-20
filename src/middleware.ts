import { NextResponse, type NextRequest } from "next/server";
import {
  HERKOMST_COOKIE,
  HERKOMST_MAX_LEEFTIJD,
  bepaalHerkomst,
  schrijfHerkomst,
} from "@/lib/herkomst";

/**
 * Herkomst vastleggen bij binnenkomst (zie lib/herkomst.ts).
 *
 * Alleen bij het openen van een pagina in de browser, niet bij het
 * doorklikken binnen de site (dat haalt Next.js op zonder nieuw document)
 * en niet bij afbeeldingen of API-verzoeken. Zegt een binnenkomst niets
 * nieuws, dan blijft de cookie zoals hij was en zetten we niets.
 */
export function middleware(request: NextRequest) {
  if (request.method !== "GET") return NextResponse.next();

  const h = request.headers;
  const isDocument =
    h.get("sec-fetch-dest") === "document" ||
    (!h.has("sec-fetch-dest") && (h.get("accept") ?? "").includes("text/html"));
  if (!isDocument || h.has("rsc") || h.has("next-router-prefetch")) {
    return NextResponse.next();
  }

  const herkomst = bepaalHerkomst({
    url: request.url,
    verwijzer: h.get("referer"),
    eigenHosts: ["blusbox.nl"],
  });
  if (!herkomst) return NextResponse.next();

  const antwoord = NextResponse.next();
  antwoord.cookies.set(HERKOMST_COOKIE, schrijfHerkomst(herkomst), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: HERKOMST_MAX_LEEFTIJD,
  });
  return antwoord;
}

export const config = {
  // Niet voor beheer, API, Next.js-bestanden of losse bestanden met een extensie.
  matcher: ["/((?!api|_next|dashboard|portaal|verkoop|account|.*\\..*).*)"],
};
