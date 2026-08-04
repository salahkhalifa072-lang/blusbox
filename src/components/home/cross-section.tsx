"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * §5.1 signature element — scroll-driven cross-section of a groepenkast.
 *
 * Phases (p = scroll progress through the wrapper, 0..1):
 *  0.00–0.35  a terminal glows, readout climbs 21 → 170 °C
 *  0.35–0.45  readout locks at 170 (the only --signaal moment), module releases
 *  0.45–0.75  aerosol wash fills the enclosure, the glow dies, readout falls
 *  0.75–1.00  rail at rest, module labelled and dimensioned
 *
 * Progress is always derived from scroll position; the keyboard controls
 * scroll the page, so there is one source of truth.
 * prefers-reduced-motion: static end-state with caption.
 */

const KEYFRAMES = [0, 0.33, 0.42, 0.7, 1];

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const ease = (t: number) => t * t * (3 - 2 * t);

function phases(p: number) {
  const heat = ease(clamp(p / 0.35));
  const lock = clamp((p - 0.35) / 0.1);
  const wash = ease(clamp((p - 0.45) / 0.3));
  const rest = ease(clamp((p - 0.75) / 0.25));

  const temp =
    p < 0.45 ? 21 + (170 - 21) * (p < 0.35 ? heat : 1) : 170 - 135 * wash;

  return {
    heat,
    lock,
    wash,
    rest,
    temp: Math.round(temp),
    glow: heat * (1 - wash),
    locked: p >= 0.35 && p < 0.5,
    discharging: p >= 0.5 && p < 0.85,
  };
}

/* ---------------------------------------------------------------- scene */

function Scene({ p }: { p: number }) {
  const f = phases(p);

  // Device rail: x positions for hoofdschakelaar, aardlekschakelaar, automaten
  const devices = [
    { x: 120, w: 76, label: "hoofdschakelaar" },
    { x: 204, w: 76, label: "aardlekschakelaar" },
    ...Array.from({ length: 6 }, (_, i) => ({
      x: 288 + i * 44,
      w: 40,
      label: `groep ${i + 1}`,
    })),
  ];
  const faultX = 288 + 2 * 44 + 20; // terminal under groep 3
  const faultY = 372;

  return (
    <svg
      viewBox="0 0 900 560"
      className="h-auto w-full"
      role="img"
      aria-label="Doorsnede van een groepenkast. Een klem loopt heet, bij 170 °C activeert de Blusbox-module zichzelf en vult de kast met aerosol. De temperatuur daalt en de installatie blijft intact."
    >
      <defs>
        <radialGradient id="glow">
          <stop offset="0%" stopColor="#e8842c" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#e8842c" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#e8842c" stopOpacity="0" />
        </radialGradient>
        <filter id="soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        {/* aerosol stays inside the enclosure — §7.9: suppression in a
            confined volume, not a fireball being blown out */}
        <clipPath id="enclosure">
          <rect x="84" y="64" width="732" height="432" />
        </clipPath>
      </defs>

      {/* enclosure */}
      <rect x="60" y="40" width="780" height="480" fill="var(--kastwit)" stroke="var(--railstaal)" />
      <rect x="84" y="64" width="732" height="432" fill="var(--kastwit-dim)" stroke="var(--railstaal)" strokeWidth="0.5" />

      {/* DIN rail */}
      <rect x="100" y="276" width="700" height="26" fill="#c9ccc9" stroke="var(--railstaal)" strokeWidth="0.75" />
      <line x1="100" y1="283" x2="800" y2="283" stroke="var(--railstaal)" strokeWidth="0.5" />
      <line x1="100" y1="295" x2="800" y2="295" stroke="var(--railstaal)" strokeWidth="0.5" />

      {/* fault glow — under groep 3 */}
      <circle
        cx={faultX}
        cy={faultY}
        r={30 + 50 * f.glow}
        fill="url(#glow)"
        opacity={f.glow}
      />

      {/* devices on the rail */}
      {devices.map((d) => (
        <g key={d.label}>
          <rect x={d.x} y={210} width={d.w} height={160} fill="#d6d8d5" stroke="var(--railstaal)" strokeWidth="0.75" />
          {/* toggle */}
          <rect x={d.x + d.w / 2 - 7} y={252} width={14} height={36} fill="#b4b8b5" stroke="var(--railstaal)" strokeWidth="0.5" />
          {/* terminals */}
          <rect x={d.x + d.w / 2 - 5} y={210} width={10} height={8} fill="#b4b8b5" />
          <rect x={d.x + d.w / 2 - 5} y={362} width={10} height={8} fill="#b4b8b5" />
        </g>
      ))}

      {/* heat discolouration on the faulty terminal */}
      <rect
        x={faultX - 5}
        y={362}
        width={10}
        height={8}
        fill="#8a4a1f"
        opacity={f.heat * (1 - f.wash * 0.6)}
      />

      {/* Blusbox module — the only saturated red in the scene */}
      <g>
        <rect x={716} y={96} width={84} height={88} fill="var(--blusrood)" />
        <text x={758} y={146} textAnchor="middle" fill="var(--kastwit)" className="data" fontSize="11" letterSpacing="1">
          BLUSBOX
        </text>
        {/* release flash at the nozzle on lock */}
        <circle cx={758} cy={188} r={6 + 10 * f.lock} fill="#ffffff" opacity={f.lock * (1 - f.wash)} filter="url(#soft)" />
      </g>

      {/* detection cord: from module along the top of the devices */}
      <path
        d={`M 758 184 C 758 200, 700 202, 620 202 L ${faultX + 40} 202 C ${faultX + 10} 202, ${faultX} 240, ${faultX} 356`}
        fill="none"
        stroke="var(--antraciet)"
        strokeWidth="2"
        strokeDasharray="none"
        opacity="0.75"
      />

      {/* aerosol wash — a front that rolls from the module across the
          enclosure (right → left), §7.4: it arrives, it does not explode */}
      <g
        clipPath="url(#enclosure)"
        filter="url(#soft)"
        opacity={f.wash > 0 ? 0.18 + 0.82 * f.wash - f.rest * 0.8 : 0}
      >
        <ellipse cx={758 - 640 * f.wash} cy={160} rx={140 + 360 * f.wash} ry={110} fill="#ffffff" opacity="0.95" />
        <ellipse cx={790 - 560 * f.wash} cy={300} rx={120 + 420 * f.wash} ry={140} fill="#ffffff" opacity="0.8" />
        <ellipse cx={800 - 460 * f.wash} cy={430} rx={110 + 460 * f.wash} ry={120} fill="#f4f4f2" opacity="0.65" />
      </g>

      {/* end-state: label + dimension, technical-drawing grammar */}
      <g opacity={f.rest} className="data" fontSize="12">
        <line x1={758} y1={96} x2={758} y2={72} stroke="var(--antraciet)" strokeWidth="1" />
        <line x1={758} y1={72} x2={846} y2={72} stroke="var(--antraciet)" strokeWidth="1" />
        <text x={850} y={76} fill="var(--antraciet)">Blusbox</text>

        {/* dimension line under the module */}
        <line x1={716} y1={204} x2={800} y2={204} stroke="var(--staal-tekst)" strokeWidth="1" />
        <line x1={716} y1={198} x2={716} y2={210} stroke="var(--staal-tekst)" strokeWidth="1" />
        <line x1={800} y1={198} x2={800} y2={210} stroke="var(--staal-tekst)" strokeWidth="1" />
        <text x={758} y={222} textAnchor="middle" fill="var(--staal-tekst)" fontSize="10">
          [VERIFY: maatvoering]
        </text>
        <text x={104} y={330} fill="var(--staal-tekst)" fontSize="10">DIN-rail</text>
      </g>

      {/* margin readout — Geist Mono. --signaal appears only at the lock,
          as a filled badge (ISO-signage grammar, antraciet on signaal ≈ 10:1) */}
      <g className="data">
        {f.locked ? (
          <rect x={92} y={84} width={196} height={48} fill="var(--signaal)" />
        ) : null}
        <text
          x={100}
          y={120}
          fontSize="44"
          fill="var(--antraciet)"
          fontWeight="500"
        >
          {String(f.temp).padStart(3, "0")} °C
        </text>
        <text x={102} y={148} fontSize="11" fill="var(--staal-tekst)">
          klem groep 3 · gemeten
        </text>
        {f.locked ? (
          <text x={102} y={168} fontSize="11" fill="var(--antraciet)">
            activeringsdrempel bereikt
          </text>
        ) : f.discharging ? (
          <text x={102} y={168} fontSize="11" fill="var(--antraciet)">
            module geactiveerd
          </text>
        ) : null}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------ container */

export function CrossSection() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const playing = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setProgress(clamp(-rect.top / total));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const scrollToProgress = useCallback((target: number, animate: boolean) => {
    const el = wrapRef.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const top = el.offsetTop + total * target;
    if (playing.current) cancelAnimationFrame(playing.current);
    if (!animate) {
      window.scrollTo({ top });
      return;
    }
    // steady mechanical move — §6: nothing else moves
    const start = window.scrollY;
    const dist = top - start;
    const dur = Math.max(1200, Math.abs(dist) * 2.2);
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = clamp((t - t0) / dur);
      window.scrollTo({ top: start + dist * ease(k) });
      if (k < 1) playing.current = requestAnimationFrame(tick);
      else playing.current = null;
    };
    playing.current = requestAnimationFrame(tick);
  }, []);

  const step = useCallback(() => {
    const next =
      KEYFRAMES.find((k) => k > progress + 0.02) ?? KEYFRAMES[0];
    scrollToProgress(next, false);
  }, [progress, scrollToProgress]);

  const play = useCallback(() => {
    scrollToProgress(0, false);
    // let the jump land before the run starts
    requestAnimationFrame(() => scrollToProgress(1, true));
  }, [scrollToProgress]);

  if (reduced) {
    return (
      <section aria-label="Doorsnede van een groepenkast met Blusbox">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Scene p={1} />
          <p className="data mt-4 text-xs text-staal-tekst">
            Statische weergave: bij 170 °C activeert de module zichzelf en
            vult de kast met aerosol. De installatie blijft intact.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Doorsnede van een groepenkast met Blusbox">
      <div ref={wrapRef} className="relative h-[350vh]">
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
          <div className="mx-auto w-full max-w-5xl px-6">
            <Scene p={progress} />
            <div className="mt-4 flex items-center gap-4">
              <button
                type="button"
                onClick={play}
                className="data rounded-[var(--radius-control)] border border-antraciet px-4 py-2 text-xs hover:bg-antraciet hover:text-kastwit"
              >
                ▶ Afspelen
              </button>
              <button
                type="button"
                onClick={step}
                className="data rounded-[var(--radius-control)] border border-railstaal px-4 py-2 text-xs text-staal-tekst hover:border-antraciet hover:text-antraciet"
              >
                Stap →
              </button>
              <p className="data ml-auto text-xs text-staal-tekst" aria-hidden>
                scroll om af te spelen
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
