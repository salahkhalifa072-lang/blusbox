/**
 * Blusbox flame-S mark, traced from the supplied logo (red S-swoosh with
 * orange flame). Replace the paths with the original vector when the
 * client supplies it — keep the same viewBox and component API.
 */
export function LogoMark({
  className = "h-8 w-8",
  title = "Blusbox",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 120"
      className={className}
      role="img"
      aria-label={title}
    >
      {/* orange flame — top right */}
      <path
        d="M63 2 C 50 22, 46 30, 55 40 C 62 47, 70 52, 71 62 C 82 50, 84 36, 76 24 C 71 16, 66 10, 63 2 Z"
        fill="#F5A653"
      />
      {/* red S-swoosh */}
      <path
        d="M52 26 C 36 34, 26 44, 24 58 C 22 70, 28 78, 40 82 C 50 85, 58 88, 57 94 C 45 96, 34 92, 26 84 C 22 96, 28 108, 42 112 C 60 117, 76 108, 78 92 C 80 78, 70 70, 56 66 C 48 63, 42 60, 43 54 C 50 50, 60 52, 68 58 C 72 48, 66 34, 52 26 Z"
        fill="#C1272D"
      />
    </svg>
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
      <LogoMark className="h-3.5 w-3.5" />
      <span className="data text-[10px] tracking-wider">BLUSBOX</span>
    </span>
  );
}
