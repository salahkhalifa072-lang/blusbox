import { SiteHeader } from "@/components/site/header";

/**
 * Dark band at the top of every subpage: sits under the floating pill
 * header, carries an eyebrow, the condensed display title and a lead.
 * `accentFrom` splits the title so the tail renders in --blusrood.
 */
export function PageHeader({
  eyebrow,
  title,
  accent,
  lead,
}: {
  eyebrow: string;
  title: string;
  /** Optional second half of the title, rendered in blusrood */
  accent?: string;
  lead?: string;
}) {
  return (
    <>
      <SiteHeader />
      <header className="bg-antraciet pb-16 pt-36 text-kastwit sm:pt-40">
        <div className="mx-auto max-w-6xl px-6">
          <p className="data text-xs uppercase tracking-widest text-railstaal">
            {eyebrow}
          </p>
          <h1 className="font-display mt-4 max-w-4xl text-[clamp(2.5rem,7vw,5rem)]">
            {title}
            {accent ? <span className="accent"> {accent}</span> : null}
          </h1>
          {lead ? (
            <p className="mt-6 max-w-2xl text-lg text-kastwit/70">{lead}</p>
          ) : null}
        </div>
      </header>
    </>
  );
}

/** Section heading used across the marketing pages. */
export function SectionTitle({
  children,
  accent,
  className = "",
}: {
  children: React.ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <h2
      className={`font-display text-[clamp(1.75rem,4vw,3rem)] ${className}`}
    >
      {children}
      {accent ? <span className="accent"> {accent}</span> : null}
    </h2>
  );
}
