import Image from "next/image";

/**
 * Blusbox flame-S mark — the client's own artwork, cropped from the supplied
 * lockup (public/logo-mark.png). Do not redraw it; if the brand file changes,
 * replace the PNG (or drop in an SVG and swap the src).
 */
export function LogoMark({
  className = "h-8 w-8",
  title = "Blusbox",
  priority = false,
  /** rendered width, so the browser can pick a small variant (§12 budget) */
  sizes = "32px",
}: {
  className?: string;
  title?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      src="/logo-mark.png"
      alt={title}
      width={531}
      height={838}
      priority={priority}
      // Without this the header mark preloads at 640 px wide (8 KB) to paint
      // at 32 px (1.2 KB) — and it preloads ahead of the LCP.
      sizes={sizes}
      className={`${className} object-contain`}
    />
  );
}

export function LogoBadge({ light = true }: { light?: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
        light ? "bg-antraciet/55 text-kastwit" : "bg-kastwit/70 text-antraciet"
      } backdrop-blur-sm`}
      aria-hidden
    >
      <LogoMark className="h-4 w-auto" title="" />
      <span className="data text-[10px] tracking-wider">BLUSBOX</span>
    </span>
  );
}
