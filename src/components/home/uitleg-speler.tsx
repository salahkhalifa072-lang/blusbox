"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { HOOFDSTUKKEN, UITLEGVIDEO, tijdcode } from "@/lib/uitlegvideo";

/**
 * De speler van de uitlegvideo, met de hoofdstukken ernaast.
 *
 * Gedrag:
 * - Het bestand hangt pas aan de video als het blok binnen een half scherm
 *   komt. Tot die tijd kost hij niets; de hero blijft snel.
 * - In beeld start hij stil en in een lus. De ondertiteling zit in het
 *   beeld, dus stil kijken mist niets. Uit beeld pauzeert hij.
 * - "Met geluid" begint opnieuw vanaf het begin, met geluid en zonder lus:
 *   wie bewust op geluid drukt, wil het verhaal vanaf het begin horen.
 * - Een hoofdstuk aantikken springt naar dat moment.
 * - Wie bewegingsarm surft krijgt geen automatisch afspelen, alleen een
 *   afspeelknop op het startbeeld.
 * - ?t=13 in de adresbalk springt bij het laden naar dat moment. Zo kan
 *   Google per hoofdstuk naar het goede punt in de video linken.
 *
 * Geen standaardbediening van de browser: die verschilt per telefoon en
 * valt op de antraciet weg. Wel echte <button>s, zodat het met het
 * toetsenbord en een schermlezer werkt.
 */
export function UitlegSpeler({
  inleiding,
  onder,
}: {
  /** Label, kop en uitleg boven de hoofdstukken. */
  inleiding: ReactNode;
  /** Koopknop, bronvermelding en uitgeschreven tekst onder de hoofdstukken. */
  onder: ReactNode;
}) {
  const kaartRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  /** Wat er moet gebeuren zodra de bron aan de video hangt. */
  const opLaden = useRef<{ tijd?: number; spelen?: boolean; scrollen?: boolean } | null>(null);
  /** De bezoeker heeft zelf op pauze gedrukt: niet vanzelf hervatten. */
  const zelfGepauzeerd = useRef(false);
  const inBeeld = useRef(false);

  const [bron, setBron] = useState(false);
  const [bewegingsarm, setBewegingsarm] = useState(false);
  const [speelt, setSpeelt] = useState(false);
  const [geluid, setGeluid] = useState(false);
  const [afgelopen, setAfgelopen] = useState(false);
  const [tijd, setTijd] = useState(0);
  /** De browser weigerde automatisch afspelen (iOS-energiebesparing e.d.). */
  const [geweigerd, setGeweigerd] = useState(false);

  const afgelopenRef = useRef(false);
  useEffect(() => {
    afgelopenRef.current = afgelopen;
  }, [afgelopen]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setBewegingsarm(mq.matches);
    const wissel = (e: MediaQueryListEvent) => setBewegingsarm(e.matches);
    mq.addEventListener("change", wissel);
    return () => mq.removeEventListener("change", wissel);
  }, []);

  // ?t=… bij binnenkomst: bron laden, naar dat moment springen en het blok
  // in beeld halen. Het scrollen gebeurt pas als de video geladen is: eerder
  // zet het herstellen van de scrollpositie de pagina weer bovenaan.
  useEffect(() => {
    const t = Number(new URLSearchParams(window.location.search).get("t"));
    if (!Number.isFinite(t) || t <= 0 || t >= UITLEGVIDEO.duurSeconden) return;
    opLaden.current = { tijd: t, scrollen: true };
    setBron(true);
  }, []);

  const speel = useCallback((opties: { metGeluid?: boolean; vanaf?: number } = {}) => {
    const video = videoRef.current;
    if (!video) return;
    if (opties.metGeluid !== undefined) {
      video.muted = !opties.metGeluid;
      video.loop = !opties.metGeluid;
      setGeluid(opties.metGeluid);
    }
    zelfGepauzeerd.current = false;
    setAfgelopen(false);
    if (!video.currentSrc) {
      opLaden.current = { tijd: opties.vanaf, spelen: true };
      setBron(true);
      return;
    }
    if (opties.vanaf !== undefined) video.currentTime = opties.vanaf;
    // Kan geweigerd worden (energiebesparing, iOS zonder tik); dan blijft
    // het startbeeld staan met de afspeelknop erop.
    video.play().catch(() => {
          setSpeelt(false);
          setGeweigerd(true);
        });
  }, []);

  // Bron vroeg genoeg aanhangen dat hij klaarstaat als je er bent.
  useEffect(() => {
    if (bron) return;
    const kaart = kaartRef.current;
    if (!kaart || bewegingsarm) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setBron(true);
          io.disconnect();
        }
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(kaart);
    return () => io.disconnect();
  }, [bron, bewegingsarm]);

  // Starten in beeld, pauzeren uit beeld.
  useEffect(() => {
    const kaart = kaartRef.current;
    if (!kaart) return;
    const io = new IntersectionObserver(
      ([e]) => {
        inBeeld.current = e.isIntersecting;
        const video = videoRef.current;
        if (!video) return;
        if (!e.isIntersecting) {
          if (!video.paused) video.pause();
        } else if (!bewegingsarm && !zelfGepauzeerd.current && !afgelopenRef.current) {
          speel();
        }
      },
      { threshold: 0.55 },
    );
    io.observe(kaart);
    return () => io.disconnect();
  }, [bewegingsarm, speel]);

  // Zodra de bron er hangt: uitstaande sprong of afspeelverzoek uitvoeren.
  useEffect(() => {
    if (!bron) return;
    const video = videoRef.current;
    if (!video) return;
    const klaar = () => {
      const wens = opLaden.current;
      opLaden.current = null;
      if (wens?.tijd !== undefined) video.currentTime = wens.tijd;
      if (wens?.scrollen) kaartRef.current?.scrollIntoView({ block: "center" });
      if (wens?.spelen || (wens?.scrollen && !bewegingsarm) || (inBeeld.current && !bewegingsarm && !zelfGepauzeerd.current)) {
        video.play().catch(() => {
          setSpeelt(false);
          setGeweigerd(true);
        });
      }
    };
    if (video.readyState >= 1) klaar();
    else video.addEventListener("loadedmetadata", klaar, { once: true });
    return () => video.removeEventListener("loadedmetadata", klaar);
  }, [bron, bewegingsarm]);

  function pauzeerOfSpeel() {
    const video = videoRef.current;
    if (!video) return;
    if (afgelopen) return speel({ vanaf: 0 });
    if (video.paused || !video.currentSrc) {
      // Bewegingsarm: de eerste tik is een bewuste keuze, dus met geluid.
      speel(bewegingsarm && !geluid && !video.currentSrc ? { metGeluid: true } : {});
    } else {
      zelfGepauzeerd.current = true;
      video.pause();
    }
  }

  function wisselGeluid() {
    if (!geluid) speel({ metGeluid: true, vanaf: 0 });
    else {
      const video = videoRef.current;
      if (video) video.muted = true;
      setGeluid(false);
    }
  }

  const actief = HOOFDSTUKKEN.reduce((a, h, i) => (tijd >= h.start - 0.05 ? i : a), 0);
  const voortgang = Math.min(1, tijd / UITLEGVIDEO.duurSeconden);

  const knopRand =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kastwit";

  return (
    // Telefoon: kop, video, hoofdstukken onder elkaar, zodat je weet wat je
    // ziet voordat het speelt. Desktop: kop en hoofdstukken links, de video
    // rechts over de volle hoogte.
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[auto_auto] lg:gap-x-16 lg:gap-y-0">
      <div className="order-1 lg:col-start-1 lg:row-start-1 lg:self-end">{inleiding}</div>

      <div className="order-3 lg:col-start-1 lg:row-start-2 lg:self-start">
        <ol className="grid gap-2.5 lg:mt-8">
          {HOOFDSTUKKEN.map((h, i) => {
            const eind = HOOFDSTUKKEN[i + 1]?.start ?? UITLEGVIDEO.duurSeconden;
            const binnen = Math.min(1, Math.max(0, (tijd - h.start) / (eind - h.start)));
            const nu = i === actief && (speelt || tijd > 0);
            return (
              <li key={h.titel}>
                <button
                  type="button"
                  onClick={() => speel({ vanaf: h.start })}
                  aria-current={nu ? "true" : undefined}
                  className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-colors ${knopRand} ${
                    nu
                      ? "border-kastwit/30 bg-kastwit/[0.07]"
                      : "border-kastwit/10 hover:border-kastwit/25 hover:bg-kastwit/[0.04]"
                  }`}
                >
                  <span className="flex items-baseline gap-3">
                    <span className={`data text-xs ${nu ? "text-blusrood-op-donker" : "text-kastwit/45"}`}>
                      {tijdcode(h.start)}
                    </span>
                    <span className="font-display text-lg text-kastwit sm:text-xl">{h.titel}</span>
                  </span>
                  <span className="mt-1 block pl-[2.6rem] text-sm text-kastwit/60">{h.tekst}</span>
                  {/* Hoe ver dit hoofdstuk is: een dunne lijn onderin. */}
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-blusrood transition-transform duration-200 ease-linear"
                    style={{ transform: `scaleX(${nu ? binnen : 0})` }}
                  />
                </button>
              </li>
            );
          })}
        </ol>

        {onder}
      </div>

      <div
        ref={kaartRef}
        className="order-2 mx-auto w-[min(82vw,340px)] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:w-[min(360px,calc((100vh-9rem)*0.5625))] lg:self-center"
      >
        <div className="relative aspect-[9/16] overflow-hidden rounded-[1.75rem] bg-antraciet-verhoogd shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] ring-1 ring-kastwit/10">
          <video
            ref={videoRef}
            src={bron ? UITLEGVIDEO.src : undefined}
            poster={UITLEGVIDEO.poster}
            width={UITLEGVIDEO.breedte}
            height={UITLEGVIDEO.hoogte}
            muted
            loop
            playsInline
            preload={bron ? "auto" : "none"}
            aria-label="Uitlegvideo: waarom de meterkast, hoe Blusbox ingrijpt en hoe je hem plaatst. De tekst staat in beeld en ook uitgeschreven onder de hoofdstukken."
            onClick={pauzeerOfSpeel}
            onPlay={() => {
              setSpeelt(true);
              setGeweigerd(false);
            }}
            onPause={() => setSpeelt(false)}
            onEnded={() => {
              setSpeelt(false);
              setAfgelopen(true);
            }}
            onTimeUpdate={(e) => setTijd(e.currentTarget.currentTime)}
            className="absolute inset-0 h-full w-full cursor-pointer object-cover"
          />

          {/* Grote afspeelknop zolang er niets loopt: bij bewegingsarm,
              als de browser automatisch afspelen weigert, en aan het eind. */}
          {!speelt && (bewegingsarm || geweigerd || afgelopen || tijd > 0) && (
            <button
              type="button"
              onClick={pauzeerOfSpeel}
              className={`absolute inset-0 flex items-center justify-center bg-antraciet/25 ${knopRand}`}
            >
              <span className="flex items-center gap-2 rounded-full bg-kastwit px-5 py-3 text-sm font-semibold text-antraciet shadow-lg">
                <Icoon soort={afgelopen ? "opnieuw" : "speel"} />
                {afgelopen ? "Opnieuw bekijken" : tijd > 0 ? "Verder kijken" : "Bekijk de video"}
              </span>
            </button>
          )}

          {/* Bediening onderin, over een zachte verloop zodat hij op elk
              beeld leesbaar blijft. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-3 pb-3 pt-10">
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={pauzeerOfSpeel}
                aria-label={speelt ? "Pauzeren" : "Afspelen"}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/40 text-kastwit backdrop-blur ${knopRand}`}
              >
                <Icoon soort={speelt ? "pauze" : "speel"} />
              </button>
              <button
                type="button"
                onClick={wisselGeluid}
                aria-pressed={geluid}
                className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold backdrop-blur transition-colors ${knopRand} ${
                  geluid ? "bg-black/40 text-kastwit" : "bg-kastwit text-antraciet"
                }`}
              >
                <Icoon soort={geluid ? "geluid" : "stil"} />
                {geluid ? "Geluid uit" : "Met geluid"}
              </button>
              <span className="data ml-auto text-[11px] text-kastwit/80">
                {tijdcode(tijd)} / {tijdcode(UITLEGVIDEO.duurSeconden)}
              </span>
            </div>
            <div aria-hidden className="mt-2.5 h-0.5 overflow-hidden rounded-full bg-kastwit/25">
              <div
                className="h-full origin-left bg-kastwit transition-transform duration-200 ease-linear"
                style={{ transform: `scaleX(${voortgang})` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Icoon({ soort }: { soort: "speel" | "pauze" | "geluid" | "stil" | "opnieuw" }) {
  const p = { width: 16, height: 16, viewBox: "0 0 24 24", "aria-hidden": true } as const;
  switch (soort) {
    case "speel":
      return (
        <svg {...p} fill="currentColor">
          <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10.4-6.5a1 1 0 0 0 0-1.7L9.53 4.65A1 1 0 0 0 8 5.5Z" />
        </svg>
      );
    case "pauze":
      return (
        <svg {...p} fill="currentColor">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      );
    case "opnieuw":
      return (
        <svg {...p} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
        </svg>
      );
    case "geluid":
      return (
        <svg {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      );
    case "stil":
      return (
        <svg {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
          <path d="m16 9 6 6" />
          <path d="m22 9-6 6" />
        </svg>
      );
  }
}
