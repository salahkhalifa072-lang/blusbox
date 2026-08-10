import Link from "next/link";
import { signOut } from "@/auth";
import { vereisDashboard } from "@/lib/sessie";
import { LogoMark } from "@/components/site/logo";

/**
 * §9.7 — every dashboard route passes through this guard. The check is
 * repeated inside each query in db/queries.ts as well; this one keeps
 * unauthorised users off the pages, that one keeps them out of the data.
 */

const nav = [
  { href: "/dashboard", label: "Overzicht" },
  { href: "/dashboard/bestellingen", label: "Bestellingen" },
  { href: "/dashboard/lots", label: "Lotregister" },
  { href: "/dashboard/units", label: "Geplaatste units" },
  { href: "/dashboard/activeringen", label: "Activeringen" },
  { href: "/dashboard/retouren", label: "Retouren" },
  { href: "/dashboard/recalls", label: "Recalls" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await vereisDashboard();

  async function uitloggen() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen bg-kastwit-dim">
      <header className="border-b border-railstaal/50 bg-antraciet text-kastwit">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <LogoMark className="h-7 w-auto" />
            <span className="font-display text-lg">Blusbox</span>
            <span className="data ml-1 rounded-full border border-kastwit/25 px-2 py-0.5 text-[10px] uppercase tracking-widest text-railstaal">
              beheer
            </span>
          </Link>

          <nav aria-label="Dashboard" className="flex-1">
            <ul className="flex flex-wrap gap-x-1 gap-y-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-full px-3 py-1.5 text-sm text-kastwit/70 transition-colors hover:bg-kastwit/10 hover:text-kastwit"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <span className="data text-xs text-railstaal">{actor.email}</span>
            <form action={uitloggen}>
              <button
                type="submit"
                className="data rounded-full border border-kastwit/30 px-3 py-1.5 text-xs text-kastwit transition-colors hover:bg-kastwit hover:text-antraciet"
              >
                Uitloggen
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
