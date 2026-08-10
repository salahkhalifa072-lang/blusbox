"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * §5.1 signature element, realistic variant. Real front-view footage of a
 * meterkast scrubbed by scroll position: fire builds → the module releases →
 * aerosol fills the cabinet → it clears and the installation is intact.
 *
 * The wrapper is 420vh tall, so at a typical ~1000 px/s trackpad flick the
 * playthrough still takes well over 3 seconds of deliberate scrolling.
 *
 * Video frames are driven by currentTime, never by play() — that keeps the
 * timeline locked to the scroll position in both directions.
 * prefers-reduced-motion: final frame as a static image with caption.
 */

/** Narrative marks as a fraction of the clip, for the readout + step control */
const PHASES = [
  { at: 0, temp: 21, note: "installatie in rust" },
  { at: 0.3, temp: 96, note: "klem loopt heet" },
  { at: 0.45, temp: 170, note: "activeringsdrempel bereikt" },
  { at: 0.62, temp: 118, note: "module geactiveerd" },
  { at: 0.85, temp: 44, note: "vlam gedoofd" },
  { at: 1, temp: 23, note: "installatie intact" },
];

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const ease = (t: number) => t * t * (3 - 2 * t);

function readout(p: number) {
  let prev = PHASES[0];
  let next = PHASES[PHASES.length - 1];
  for (let i = 0; i < PHASES.length - 1; i++) {
    if (p >= PHASES[i].at && p <= PHASES[i + 1].at) {
      prev = PHASES[i];
      next = PHASES[i + 1];
      break;
    }
  }
  const span = next.at - prev.at || 1;
  const k = clamp((p - prev.at) / span);
  return {
    temp: Math.round(prev.temp + (next.temp - prev.temp) * k),
    note: k > 0.5 ? next.note : prev.note,
    /** the 170 °C lock — the only --signaal moment on the page */
    locked: p >= 0.42 && p < 0.55,
  };
}

export function ScrollScrub() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  /**
   * The scrub source is the largest asset on the site and scrubbing needs
   * the whole file buffered, so it cannot be lazy in the usual sense. It
   * is instead fetched only once the section comes within a screen of the
   * viewport — the hero and the LCP are long done by then.
   */
  const [laadBron, setLaadBron] = useState(false);
  const anim = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Start fetching the source when the section is within a screen.
  useEffect(() => {
    if (reduced || laadBron) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLaadBron(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, laadBron]);

  // Scroll → progress → video.currentTime
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = wrapRef.current;
      const video = videoRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = clamp(-rect.top / total);
      setProgress(p);
      if (video?.duration) {
        // pull back from the very end; the last frames are often duplicated
        video.currentTime = p * (video.duration - 0.05);
      }
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
  }, [reduced, ready]);

  const scrollToProgress = useCallback((target: number, animate: boolean) => {
    const el = wrapRef.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const top = el.offsetTop + total * target;
    if (anim.current) cancelAnimationFrame(anim.current);
    if (!animate) {
      window.scrollTo({ top });
      return;
    }
    const start = window.scrollY;
    const dist = top - start;
    // deliberately slow: a full playthrough runs ~6 s
    const dur = Math.max(2400, Math.abs(dist) * 2.4);
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = clamp((t - t0) / dur);
      window.scrollTo({ top: start + dist * ease(k) });
      if (k < 1) anim.current = requestAnimationFrame(tick);
      else anim.current = null;
    };
    anim.current = requestAnimationFrame(tick);
  }, []);

  const play = useCallback(() => {
    scrollToProgress(0, false);
    requestAnimationFrame(() => scrollToProgress(1, true));
  }, [scrollToProgress]);

  const step = useCallback(() => {
    const next =
      PHASES.map((p) => p.at).find((a) => a > progress + 0.02) ?? PHASES[0].at;
    scrollToProgress(next, false);
  }, [progress, scrollToProgress]);

  const r = readout(progress);

  const caption =
    "Vooraanzicht van een meterkast: een beginnende brand bij de bedrading, de Blusbox-module activeert bij 170 °C en vult de kast met aerosol. De vlam dooft en de installatie blijft intact.";

  if (reduced) {
    return (
      <section
        aria-label="Blusbox in werking"
        className="bg-antraciet py-16 text-kastwit"
      >
        <div className="mx-auto max-w-4xl px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/meterkast-front.jpg"
            alt={caption}
            className="w-full"
          />
          <p className="data mt-4 text-xs text-railstaal">
            Statische weergave. {caption} Beeld is een weergave.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Blusbox in werking" className="bg-antraciet">
      <div ref={wrapRef} className="relative h-[420vh]">
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="mx-auto w-full max-w-5xl px-6">
            <div className="relative mx-auto max-w-3xl">
              <video
                ref={videoRef}
                className="w-full bg-antraciet-verhoogd"
                // src is attached only once the section is near, so the
                // poster carries the frame until then and the hero's LCP
                // never competes with a multi-megabyte download.
                src={laadBron ? "/media/meterkast-front.mp4" : undefined}
                poster="/media/meterkast-front.jpg"
                muted
                playsInline
                preload={laadBron ? "auto" : "none"}
                aria-label={caption}
                onLoadedMetadata={() => setReady(true)}
              >
                {/* §12: a Dutch description track. The clip is silent, so
                    these describe what is shown rather than transcribe
                    speech — that is what makes it followable without
                    seeing it. */}
                <track
                  kind="descriptions"
                  src="/media/meterkast-front.nl.vtt"
                  srcLang="nl"
                  label="Nederlands"
                  default
                />
              </video>

              {/* margin readout, ISO-signage grammar */}
              <div className="pointer-events-none absolute left-0 top-0 p-4 sm:p-6">
                <div
                  className={`inline-block px-3 py-1.5 ${
                    r.locked ? "bg-signaal" : "bg-antraciet/70 backdrop-blur-sm"
                  }`}
                >
                  <p
                    className={`data text-2xl leading-none sm:text-4xl ${
                      r.locked ? "text-antraciet" : "text-kastwit"
                    }`}
                  >
                    {String(r.temp).padStart(3, "0")} °C
                  </p>
                </div>
                <p className="data mt-2 text-[11px] text-kastwit drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {r.note}
                </p>
              </div>

              {/* progress rail */}
              <div
                className="absolute bottom-0 left-0 h-1 w-full bg-kastwit/20"
                aria-hidden
              >
                <div
                  className="h-full bg-blusrood"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>

            <div className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={play}
                className="data rounded-full border border-kastwit px-5 py-2 text-xs text-kastwit transition-colors hover:bg-kastwit hover:text-antraciet"
              >
                ▶ Afspelen
              </button>
              <button
                type="button"
                onClick={step}
                className="data rounded-full border border-kastwit/40 px-5 py-2 text-xs text-railstaal transition-colors hover:border-kastwit hover:text-kastwit"
              >
                Stap →
              </button>
              <p className="data ml-auto text-[11px] text-railstaal">
                scroll om af te spelen · beeld is een weergave
              </p>
            </div>

            {/* §12: a text alternative that is always reachable, not only
                under prefers-reduced-motion. Collapsed so it does not
                compete with the sequence, but it is real text in the DOM
                and in the tab order. */}
            <details className="mx-auto mt-4 max-w-3xl">
              <summary className="data cursor-pointer text-[11px] text-railstaal underline underline-offset-4">
                Beschrijving in tekst
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-kastwit/70">
                {caption} De temperatuurweergave loopt op van 21 °C naar de
                activeringsdrempel van 170 °C en daalt daarna weer.
              </p>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
