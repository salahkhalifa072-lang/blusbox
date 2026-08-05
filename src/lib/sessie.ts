import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { magDashboard, magInstallateursportaal, vereis } from "@/lib/rollen";
import type { Rol } from "@/db/schema";

export type Actor = { id: string; rol: Rol; email: string };

/** Current actor, or null when signed out. */
export async function huidigeActor(): Promise<Actor | null> {
  const sessie = await auth();
  if (!sessie?.user?.id) return null;
  return {
    id: sessie.user.id,
    rol: sessie.user.rol,
    email: sessie.user.email,
  };
}

/** Route guard for anything behind a login. */
export async function vereisLogin(): Promise<Actor> {
  const actor = await huidigeActor();
  if (!actor) redirect("/account");
  return actor;
}

/** §9.7 — /dashboard/* is admin and operations only. */
export async function vereisDashboard(): Promise<Actor> {
  const actor = await vereisLogin();
  vereis(magDashboard(actor.rol), "dashboard openen");
  return actor;
}

/** §9.6 — the reduced installer portal. */
export async function vereisInstallateur(): Promise<Actor> {
  const actor = await vereisLogin();
  vereis(magInstallateursportaal(actor.rol), "installateursportaal openen");
  return actor;
}
