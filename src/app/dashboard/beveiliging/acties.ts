"use server";

import { revalidatePath } from "next/cache";
import { vereisDashboard } from "@/lib/sessie";
import { deblokkeer } from "@/lib/inlogbewaking";

export async function hefBlokkadeOp(formData: FormData): Promise<void> {
  const actor = await vereisDashboard();
  const ip = String(formData.get("ip") ?? "");
  if (!ip) return;
  await deblokkeer(ip);
  console.info(`[inlogbewaking] blokkade ${ip} opgeheven door ${actor.email}`);
  revalidatePath("/dashboard/beveiliging");
}
