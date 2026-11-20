"use server";

import { redirect } from "next/navigation";
import { vereisLogin } from "@/lib/sessie";
import {
  annuleerKoppeling,
  bevestigKoppeling,
  startKoppeling,
  vernieuwHerstelcodes,
  zetTweestapsUit,
  type CodeUitkomst,
} from "@/lib/tweestaps";

export type CodeStaat =
  | { fase: "leeg" }
  | { fase: "fout"; melding: string }
  | { fase: "klaar"; herstelcodes: string[] };

function melding(uitkomst: CodeUitkomst): string {
  if (uitkomst === "geblokkeerd")
    return "Te vaak een verkeerde code. Probeer het over een kwartier opnieuw.";
  if (uitkomst === "niet-actief")
    return "Er loopt geen koppeling. Ververs de pagina en begin opnieuw.";
  return "Die code klopt niet. Neem de code die nu in de app staat.";
}

export async function begin(): Promise<void> {
  const actor = await vereisLogin();
  await startKoppeling(actor.id);
  redirect("/account/beveiliging");
}

export async function annuleer(): Promise<void> {
  const actor = await vereisLogin();
  await annuleerKoppeling(actor.id);
  redirect("/account/beveiliging");
}

export async function bevestig(_: CodeStaat, formData: FormData): Promise<CodeStaat> {
  const actor = await vereisLogin();
  const { uitkomst, herstelcodes } = await bevestigKoppeling(
    actor.id,
    String(formData.get("code") ?? ""),
  );
  if (uitkomst !== "goed" || !herstelcodes) return { fase: "fout", melding: melding(uitkomst) };
  return { fase: "klaar", herstelcodes };
}

export async function nieuweCodes(_: CodeStaat, formData: FormData): Promise<CodeStaat> {
  const actor = await vereisLogin();
  const { uitkomst, herstelcodes } = await vernieuwHerstelcodes(
    actor.id,
    String(formData.get("code") ?? ""),
  );
  if (uitkomst !== "goed" || !herstelcodes) return { fase: "fout", melding: melding(uitkomst) };
  return { fase: "klaar", herstelcodes };
}

export async function zetUit(_: CodeStaat, formData: FormData): Promise<CodeStaat> {
  const actor = await vereisLogin();
  const uitkomst = await zetTweestapsUit(actor.id, String(formData.get("code") ?? ""));
  if (uitkomst !== "goed") return { fase: "fout", melding: melding(uitkomst) };
  redirect("/account/beveiliging?uit=1");
}
