"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { koopNu } from "@/app/winkelwagen/acties";

/**
 * Vaste koopbalk onderaan, alleen op telefoons.
 *
 * Verschijnt zodra de koopknop van de hero uit beeld is, en verdwijnt
 * weer bij het koopblok onderaan: daar staat de knop al groot, en twee
 * keer dezelfde knop boven elkaar is ruis. Onder de cookiebanner (z-40
 * tegen z-50), zodat die nooit wordt afgedekt.
 */
function Knop({ prijs }: { prijs: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-semibold text-kastwit disabled:opacity-60"
    >
      {pending ? "Bezig…" : `Koop nu · ${prijs}`}
    </button>
  );
}

export function MobieleKoopbalk({ prijs, regel }: { prijs: string; regel: string }) {
  const [heroWeg, setHeroWeg] = useState(false);
  const [slotZichtbaar, setSlotZichtbaar] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-koop");
    const slot = document.getElementById("slot-koop");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) setHeroWeg(!e.isIntersecting && e.boundingClientRect.top < 0);
        if (e.target === slot) setSlotZichtbaar(e.isIntersecting);
      }
    });
    if (hero) io.observe(hero);
    if (slot) io.observe(slot);
    return () => io.disconnect();
  }, []);

  const zichtbaar = heroWeg && !slotZichtbaar;

  return (
    <div
      aria-hidden={!zichtbaar}
      inert={!zichtbaar}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-kastwit/10 bg-antraciet/95 text-kastwit backdrop-blur transition-transform duration-300 motion-reduce:transition-none lg:hidden ${
        zichtbaar ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">Blusbox blusmodule</p>
          <p className="data truncate text-[11px] text-kastwit/60">{regel}</p>
        </div>
        <form action={koopNu}>
          <input type="hidden" name="slug" value="blusbox" />
          <Knop prijs={prijs} />
        </form>
      </div>
    </div>
  );
}
