import Link from "next/link";
import { LogoMark } from "@/components/site/logo";

const nav = [
  { href: "/blusbox", label: "Product" },
  { href: "/hoe-het-werkt", label: "Hoe het werkt" },
  { href: "/zakelijk", label: "Zakelijk" },
  { href: "/veelgestelde-vragen", label: "Vragen" },
];

/**
 * Floating pill header over the dark hero — the reference pattern:
 * mark left, centred pill nav, single filled CTA right.
 */
export function SiteHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border border-kastwit/15 bg-antraciet/70 px-4 py-2.5 backdrop-blur-md sm:px-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-kastwit"
          aria-label="Blusbox, naar de homepage"
        >
          <LogoMark className="h-7 w-7" />
          <span className="font-display text-lg tracking-tight">Blusbox</span>
        </Link>

        <nav aria-label="Hoofdnavigatie" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm text-kastwit/70 transition-colors hover:bg-kastwit/10 hover:text-kastwit"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/winkelwagen"
            className="data hidden whitespace-nowrap text-xs text-kastwit/60 transition-colors hover:text-kastwit sm:inline"
          >
            Winkelwagen (0)
          </Link>
          <Link
            href="/blusbox"
            className="rounded-full bg-blusrood px-4 py-2 text-sm font-medium text-kastwit transition-colors hover:bg-[#b81e1b]"
          >
            Bestellen
          </Link>
        </div>
      </div>
    </header>
  );
}
