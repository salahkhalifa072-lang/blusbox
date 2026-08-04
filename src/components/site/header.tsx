import Link from "next/link";

const nav = [
  { href: "/blusbox", label: "Blusbox" },
  { href: "/hoe-het-werkt", label: "Hoe het werkt" },
  { href: "/zakelijk", label: "Zakelijk" },
  { href: "/veelgestelde-vragen", label: "Vragen" },
];

export function SiteHeader() {
  return (
    <header className="hairline-b sticky top-0 z-50 bg-kastwit/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg tracking-tight">
          Blusbox
        </Link>
        <nav aria-label="Hoofdnavigatie">
          <ul className="flex items-center gap-6 text-sm">
            {nav.map((item) => (
              <li key={item.href} className="hidden sm:block">
                <Link
                  href={item.href}
                  className="text-staal-tekst transition-colors hover:text-antraciet"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/winkelwagen"
                className="data text-xs text-staal-tekst hover:text-antraciet"
              >
                Winkelwagen (0)
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
