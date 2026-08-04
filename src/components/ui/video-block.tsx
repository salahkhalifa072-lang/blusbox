"use client";

import { useEffect, useRef, useState } from "react";

/**
 * §7.10 web implementation: muted, playsInline, loop, poster at LCP,
 * IntersectionObserver-deferred playback, static poster under
 * prefers-reduced-motion.
 */
export function VideoBlock({
  src,
  poster,
  label,
  className = "",
  priority = false,
}: {
  src: string;
  poster: string;
  /** Dutch text alternative for the moving image */
  label: string;
  className?: string;
  /** Hero use: keep preload metadata but start as soon as visible */
  priority?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced) return;
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
  }, [reduced, priority]);

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
      preload={priority ? "auto" : "metadata"}
      poster={poster}
      aria-label={label}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
