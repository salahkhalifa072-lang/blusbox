import { TRUSTPILOT_SCHRIJVEN } from "@/lib/trustpilot";

/**
 * Knop naar het reviewscherm op Trustpilot.
 *
 * Bewust geen officiële TrustBox. Die laadt een script van Trustpilot op
 * elke pagina met reviews, en het cookiebeleid belooft dat er zonder
 * toestemming niets van derden geladen wordt. De reviewverzamelaar doet
 * bovendien niets meer dan deze link: wie klikt, komt in hetzelfde
 * schrijfscherm.
 *
 * Een TrustBox met de score wordt pas zinvol als er op Trustpilot reviews
 * staan, en dan hoort hij achter de cookietoestemming.
 */
export function TrustpilotWidget({ className = "" }: { className?: string }) {
  return (
    <a
      href={TRUSTPILOT_SCHRIJVEN}
      target="_blank"
      rel="noopener"
      className={`inline-flex items-center gap-2 rounded-full border border-antraciet/20 bg-white px-4 py-2 text-sm font-medium text-antraciet transition hover:border-[#00b67a] ${className}`}
    >
      Beoordeel ons op
      <span className="inline-flex items-center gap-1 font-semibold">
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-[#00b67a]">
          <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.5l7.1-.6z" />
        </svg>
        Trustpilot
      </span>
    </a>
  );
}
