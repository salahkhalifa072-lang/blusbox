"use client";

import { useEffect, useRef, useState } from "react";

/**
 * §7.10 web implementation: muted, playsInline, loop, poster at LCP,
 * IntersectionObserver-deferred playback, static poster under
 * prefers-reduced-motion.
 *
 * Non-priority clips get no `src` at all until the viewport comes near them.
 * A <source> in the markup is enough for the browser to start fetching, and
 * on mobile that put a 1.5 MB file on the wire while the hero was still
 * painting — measured at LCP 5.4 s. Attaching the source late costs nothing
 * visually, because the poster is already on screen.
 */
export function VideoBlock({
  src,
  av1Src,
  poster,
  label,
  className = "",
  priority = false,
}: {
  src: string;
  /** §7.10 AV1 variant, used where the browser can decode it (~30% smaller) */
  av1Src?: string;
  poster: string;
  /** Dutch text alternative for the moving image */
  label: string;
  className?: string;
  /** Hero use: load straight away, it is the LCP */
  priority?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);
  const [dichtbij, setDichtbij] = useState(priority);
  const [av1, setAv1] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /**
   * Feature-detect rather than declare <source type="…codecs=av01…">: the
   * exact level in that string has to match the stream or Safari skips the
   * source silently. canPlayType only needs to answer "can you do AV1".
   *
   * The probe cannot run during render — the server has no <video> to ask,
   * and a different answer on the client would be a hydration mismatch. So
   * the priority clip, whose source is attached on the very first render,
   * always ships H.264. That is the right default for it anyway: it is the
   * LCP, and H.264 is hardware-decoded on every device we ship to.
   */
  useEffect(() => {
    if (!av1Src || priority) return;
    const probe = document.createElement("video");
    setAv1(probe.canPlayType('video/mp4; codecs="av01.0.05M.08"') !== "");
  }, [av1Src, priority]);

  // one screen ahead: far enough that the clip is ready on arrival, near
  // enough that it never competes with the hero
  useEffect(() => {
    if (reduced || dichtbij) return;
    const video = ref.current;
    if (!video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDichtbij(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [reduced, dichtbij]);

  useEffect(() => {
    if (reduced || !dichtbij) return;
    const video = ref.current;
    if (!video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: priority ? "0px" : "120px" },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [reduced, dichtbij, priority]);

  if (reduced) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={poster} alt={label} className={className} />
    );
  }

  return (
    <video
      ref={ref}
      className={className}
      muted
      playsInline
      loop
      preload={priority ? "auto" : dichtbij ? "auto" : "none"}
      poster={poster}
      aria-label={label}
    >
      {dichtbij ? (
        <source src={av1 && av1Src ? av1Src : src} type="video/mp4" />
      ) : null}
    </video>
  );
}
