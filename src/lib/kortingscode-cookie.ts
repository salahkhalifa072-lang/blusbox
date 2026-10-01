import { cookies } from "next/headers";
import { zoekKortingscode, type Kortingscode } from "./kortingscode";

/**
 * De ingevoerde kortingscode tussen het invullen en het betalen.
 *
 * De cookie bewaart alleen wat de klant typte. Elke keer dat hij gelezen
 * wordt gaat de code opnieuw door zoekKortingscode: een code die intussen
 * is ingetrokken, of een met de hand aangepaste cookie, levert dan
 * gewoon geen korting op.
 */

const COOKIE = "blusbox_kortingscode";

export async function leesKortingscode(): Promise<Kortingscode | null> {
  const jar = await cookies();
  return zoekKortingscode(jar.get(COOKIE)?.value);
}

export async function schrijfKortingscode(code: string | null): Promise<void> {
  const jar = await cookies();
  if (!code) {
    jar.delete(COOKIE);
    return;
  }
  jar.set(COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // een dag; daarna opnieuw intypen
  });
}
