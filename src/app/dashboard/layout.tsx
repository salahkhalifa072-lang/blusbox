import type { Metadata } from "next";
import { signOut } from "@/auth";
import { vereisDashboard } from "@/lib/sessie";
import { magFactureren } from "@/lib/rollen";
import { DashboardNavigatie, type NavItem } from "@/components/dashboard/navigatie";

/**
 * §9.7 — every dashboard route passes through this guard. The check is
 * repeated inside each query in db/queries.ts as well; this one keeps
 * unauthorised users off the pages, that one keeps them out of the data.
 */

// Zonder eigen titel droeg elk beheertabblad de titel van de homepage.
export const metadata: Metadata = {
  title: "Beheer",
  robots: { index: false, follow: false },
};

/*
 * `kort` zet een item ook in de balk onderin op een telefoon. Vier is het
 * maximum dat op 320 px nog leesbaar naast "Meer" past.
 */
const nav: (NavItem & { alleenFactureren?: boolean })[] = [
  { href: "/dashboard", label: "Overzicht", groep: "Verkoop", kort: "Overzicht" },
  { href: "/dashboard/bestellingen", label: "Bestellingen", groep: "Verkoop", kort: "Bestellingen" },
  { href: "/dashboard/facturen", label: "Facturen", groep: "Verkoop", kort: "Facturen", alleenFactureren: true },
  { href: "/dashboard/kortingscodes", label: "Kortingscodes", groep: "Verkoop" },
  { href: "/dashboard/retouren", label: "Retouren", groep: "Verkoop" },
  { href: "/dashboard/affiliates", label: "Affiliates", groep: "Partners", kort: "Affiliates" },
  { href: "/dashboard/lots", label: "Lotregister", groep: "Product en veiligheid" },
  { href: "/dashboard/units", label: "Geplaatste units", groep: "Product en veiligheid" },
  { href: "/dashboard/activeringen", label: "Activeringen", groep: "Product en veiligheid" },
  { href: "/dashboard/recalls", label: "Recalls", groep: "Product en veiligheid" },
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

  const items = nav
    .filter((item) => !item.alleenFactureren || magFactureren(actor.rol))
    .map(({ href, label, groep, kort }) => ({ href, label, groep, kort }));

  return (
    <div className="min-h-screen bg-kastwit-dim lg:flex">
      <DashboardNavigatie items={items} email={actor.email} uitloggen={uitloggen} />
      {/* pb-24: ruimte voor de knoppenbalk onderin op een telefoon */}
      <main className="mx-auto w-full min-w-0 max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
