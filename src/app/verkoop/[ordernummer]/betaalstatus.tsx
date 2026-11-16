"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { deurverkoopStatus } from "../acties";

/**
 * Kijkt elke paar seconden of Stripe de betaling al heeft gemeld. Zodra dat
 * zo is verdwijnt de QR-code en ziet de verkoper een duidelijk "betaald",
 * met het factuurnummer: dat kan hij de klant laten zien voordat hij de
 * module overhandigt.
 */
export function Betaalstatus({
  ordernummer,
  beginstatus,
  email,
  begincontant,
  beginfactuur,
  children,
}: {
  ordernummer: string;
  beginstatus: string;
  email: string | null;
  begincontant: boolean;
  beginfactuur: string | null;
  children: ReactNode;
}) {
  const [status, setStatus] = useState(beginstatus);
  const [contant, setContant] = useState(begincontant);
  const [factuur, setFactuur] = useState<string | null>(beginfactuur);

  useEffect(() => {
    if (status !== "nieuw") return;
    let actief = true;
    const tik = setInterval(async () => {
      const s = await deurverkoopStatus(ordernummer).catch(() => null);
      if (!actief || !s) return;
      setStatus(s.status);
      setFactuur(s.factuurnummer);
      setContant(s.contant);
    }, 3000);
    return () => {
      actief = false;
      clearInterval(tik);
    };
  }, [ordernummer, status]);

  if (status === "geleverd") {
    return (
      <div role="status" className="mt-4 rounded-3xl bg-[#2c6b4d] p-6 text-center text-kastwit">
        <p className="text-5xl" aria-hidden>✓</p>
        <p className="font-display mt-2 text-3xl">{contant ? "Contant betaald" : "Betaald"}</p>
        <p className="mt-2 text-sm text-kastwit/85">
          {factuur ? `Factuur ${factuur} ` : "De factuur "}
          gaat nu per mail naar {email ?? "de klant"}, met het herroepingsformulier erbij.
        </p>
        <Link href="/verkoop" className="mt-5 inline-block rounded-full bg-kastwit px-6 py-3 text-sm font-semibold text-antraciet">
          Volgende verkoop
        </Link>
      </div>
    );
  }

  if (status === "geannuleerd") {
    return <p className="mt-4 rounded-3xl bg-kastwit p-5 text-sm text-staal-tekst">Deze verkoop is geannuleerd.</p>;
  }

  return (
    <>
      <p className="mt-4 flex items-center justify-center gap-2 text-sm text-staal-tekst" aria-live="polite">
        <span className="h-2 w-2 animate-pulse rounded-full bg-signaal" aria-hidden />
        Wacht op betaling…
      </p>
      {children}
    </>
  );
}
