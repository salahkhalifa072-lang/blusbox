import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/blusbox", label: "Blusbox" },
      { href: "/hoe-het-werkt", label: "Hoe het werkt" },
      { href: "/installatie", label: "Installatie" },
      { href: "/downloads", label: "Downloads" },
    ],
  },
  {
    title: "Zakelijk",
    links: [
      { href: "/zakelijk", label: "Voor bedrijven" },
      { href: "/installateurs", label: "Voor installateurs" },
    ],
  },
  {
    title: "Service",
    links: [
      { href: "/veelgestelde-vragen", label: "Veelgestelde vragen" },
      { href: "/retourneren", label: "Retourneren" },
      { href: "/herroepingsrecht", label: "Herroepingsrecht" },
      { href: "/garantie", label: "Garantie" },
      { href: "/verzending", label: "Verzending" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Juridisch",
    links: [
      { href: "/algemene-voorwaarden", label: "Algemene voorwaarden" },
      { href: "/privacyverklaring", label: "Privacyverklaring" },
      { href: "/cookiebeleid", label: "Cookiebeleid" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-antraciet text-kastwit">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="data mb-4 text-xs uppercase tracking-wider text-railstaal">
                {col.title}
              </h2>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-kastwit/80 transition-colors hover:text-kastwit"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        {/* §8: KvK, BTW-id, adres en e-mail verplicht in de footer */}
        <div className="data mt-16 border-t border-kastwit/20 pt-6 text-xs text-railstaal">
          <p>
            Blusbox · [VERIFY: KvK-nummer] · [VERIFY: BTW-id] ·
            [VERIFY: vestigingsadres] · [VERIFY: e-mailadres]
          </p>
          <p className="mt-2">© {new Date().getFullYear()} Blusbox</p>
        </div>
      </div>
    </footer>
  );
}
