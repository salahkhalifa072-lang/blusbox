import Link from "next/link";
import { LogoMark } from "@/components/site/logo";
import { ShippingBanner } from "@/components/site/usp-bar";
import { WagenBadge } from "@/components/site/wagen-badge";
import { MobielMenu } from "@/components/site/mobiel-menu";
import { KopBijScrollen } from "@/components/site/kop-bij-scrollen";

const nav = [
  { href: "/blusbox", label: "Product" },
  { href: "/hoe-het-werkt", label: "Hoe het werkt" },
  { href: "/zakelijk", label: "Zakelijk" },
  { href: "/affiliate", label: "Partner" },
  { href: "/veelgestelde-vragen", label: "Vragen" },
];

/**
 * Floating pill header over the dark hero — the reference pattern:
 * mark left, centred pill nav, single filled CTA right.
 *
 * Bij naar beneden scrollen schuift de pill weg en blijft alleen de
 * verzendbalk staan; naar boven scrollen haalt hem terug. Zie KopBijScrollen.
 */
export function SiteHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      {/* Boven de pill gestapeld: de pill schuift er bij het scrollen onder weg. */}
      <div className="pointer-events-auto relative z-10">
        <ShippingBanner />
      </div>
      <KopBijScrollen>
      {/* relative: het mobiele menupaneel hangt hieronder */}
      <div className="pointer-events-auto relative mx-4 mt-3 flex max-w-6xl items-center justify-between gap-4 rounded-full border border-kastwit/15 bg-antraciet/70 px-4 py-2.5 backdrop-blur-md sm:mx-6 lg:mx-auto lg:px-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-kastwit"
          aria-label="Blusbox, naar de homepage"
        >
          <LogoMark className="h-8 w-auto" title="" priority />
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

        <div className="flex items-center gap-2 sm:gap-3">
          <WagenBadge />
          <MobielMenu items={nav} />
          <Link
            href="/blusbox"
            className="rounded-full bg-blusrood-vlak px-4 py-2 text-sm font-medium text-kastwit transition-colors hover:bg-[#9e1b18]"
          >
            Bestellen
          </Link>
        </div>
      </div>
      </KopBijScrollen>
    </header>
  );
}
