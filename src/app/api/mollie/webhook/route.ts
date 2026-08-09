import { NextResponse } from "next/server";
import { haalBetaling, naarOrderStatus } from "@/lib/mollie";
import { markeerBetaald } from "@/lib/bestelling";

/**
 * Mollie webhook.
 *
 * Mollie posts only a payment id — never an amount or a status — so the
 * status is fetched back from Mollie over an authenticated call. That is
 * what makes the endpoint safe to leave open: a forged POST can at most
 * make us re-read a real payment we already know about.
 *
 * Always answer 200 once handled. A non-200 makes Mollie retry, and
 * retrying will not fix a malformed id.
 */
export async function POST(request: Request) {
  let id: string | null = null;

  try {
    const form = await request.formData();
    id = String(form.get("id") ?? "") || null;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const betaling = await haalBetaling(id);
    const orderId = betaling.metadata?.orderId;

    if (!orderId) {
      // Not one of ours, or created before metadata existed. Nothing to do,
      // but do not ask Mollie to retry.
      return NextResponse.json({ ok: true });
    }

    await markeerBetaald(orderId, betaling.id, naarOrderStatus(betaling.status));
    return NextResponse.json({ ok: true });
  } catch {
    // A transient failure on our side: 500 makes Mollie retry, which is
    // what we want here.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
