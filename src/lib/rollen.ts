import type { Rol } from "@/db/schema";

/**
 * §9.7 role enforcement. These predicates are the single definition of
 * who may do what; the data-access layer calls them before every query
 * that crosses a tenant boundary, so a missing UI check can never become
 * a data leak on its own.
 */

export const ROLLEN: readonly Rol[] = [
  "admin",
  "operations",
  "installateur",
  "klant",
] as const;

/** Full back-office: lots, recalls, content, users. */
export function magDashboard(rol: Rol): boolean {
  return rol === "admin" || rol === "operations";
}

/** Opening a recall touches customers directly — admin only. */
export function magRecallOpenen(rol: Rol): boolean {
  return rol === "admin";
}

/** Lot register and fulfilment: operations does the daily work. */
export function magLotsBeheren(rol: Rol): boolean {
  return rol === "admin" || rol === "operations";
}

/** Dealer portal (§9.6). */
export function magInstallateursportaal(rol: Rol): boolean {
  return rol === "installateur" || magDashboard(rol);
}

/** Business pricing: excl. btw, staffels, op rekening. */
export function magZakelijkePrijzenZien(rol: Rol): boolean {
  return rol === "installateur" || magDashboard(rol);
}

export class GeenToegangError extends Error {
  constructor(actie: string) {
    super(`Geen toegang: ${actie}`);
    this.name = "GeenToegangError";
  }
}

/** Throws rather than returning false, so a forgotten check cannot pass. */
export function vereis(
  toegestaan: boolean,
  actie: string,
): asserts toegestaan is true {
  if (!toegestaan) throw new GeenToegangError(actie);
}

/**
 * Scope filter for "may this actor see this unit?".
 *  - admin/operations: everything
 *  - installateur: only units they installed
 *  - klant: only units they own
 */
export function unitScope(actor: { id: string; rol: Rol }):
  | { soort: "alles" }
  | { soort: "installateur"; installateurId: string }
  | { soort: "eigenaar"; userId: string } {
  if (magDashboard(actor.rol)) return { soort: "alles" };
  if (actor.rol === "installateur") {
    return { soort: "installateur", installateurId: actor.id };
  }
  return { soort: "eigenaar", userId: actor.id };
}
