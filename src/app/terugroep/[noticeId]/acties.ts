"use server";

import { revalidatePath } from "next/cache";
import { registreerBevestiging } from "@/db/queries";

/**
 * Bevestiging door de afnemer zelf. Bewust publiek: veel kopers hebben geen
 * account, en iemand die net hoort dat het product in zijn meterkast niet
 * werkt, moet niet eerst een wachtwoord gaan bedenken.
 *
 * De notice-id (uuid v4) is de sleutel. Wie de link heeft mag bevestigen —
 * dat is de bedoeling, want de link staat in de mail aan die persoon. De
 * pagina toont daarom géén persoonsgegevens: als een link wordt doorgestuurd
 * lekt er niets meer dan het lotnummer en de reden, en die zijn toch al
 * openbaar zodra er een terugroepactie loopt.
 *
 * Bevestigen is een POST en geen link met de id erin. Virusscanners en
 * previewers van mailclients openen elke link in een bericht; zou een GET
 * volstaan, dan zou de helft van de lijst "bevestigd" zijn zonder dat er een
 * mens gekeken heeft.
 */
export async function bevestigOntvangst(formData: FormData) {
  const noticeId = String(formData.get("noticeId") ?? "").trim();
  if (!noticeId) return;

  // De eerste bevestiging telt; zie registreerBevestiging.
  await registreerBevestiging(noticeId);

  revalidatePath(`/terugroep/${noticeId}`);
  revalidatePath("/dashboard/recalls");
}
