import Image from "next/image";

/**
 * Betaalmethoden en het veilig-betalen-signaal op de productpagina.
 *
 * Over de logo's. iDEAL, Apple Pay, Bancontact en Klarna zijn beschermde
 * merken met eigen huisstijlregels. Zelf een benadering natekenen mag niet
 * en ziet er bovendien altijd nét verkeerd uit. Daarom rendert dit
 * component het officiële bestand zodra het bestaat, en tot die tijd een
 * verzorgde woordmerk-variant in de huisletter. Beide zien er af.
 *
 * Officiële bestanden neerzetten als:
 *   public/media/betaalmethoden/ideal.svg
 *   public/media/betaalmethoden/apple-pay.svg
 *   public/media/betaalmethoden/bancontact.svg
 *   public/media/betaalmethoden/klarna.svg
 *   public/media/betaalmethoden/kaart.svg
 *
 * Stripe levert deze set aan handelaren; zet `logo: true` zodra ze staan.
 *
 * Welke methodes je klant écht ziet bepaalt het Stripe-dashboard, niet deze
 * lijst. Houd ze gelijk — een methode tonen die bij het afrekenen ontbreekt
 * is een belofte die je bij de kassa breekt.
 */

type Methode = {
  slug: string;
  naam: string;
  /** Zet op true zodra het officiële bestand in public/ staat. */
  logo?: boolean;
};

const METHODEN: Methode[] = [
  { slug: "ideal", naam: "iDEAL" },
  { slug: "apple-pay", naam: "Apple Pay" },
  { slug: "bancontact", naam: "Bancontact" },
  { slug: "klarna", naam: "Klarna" },
  { slug: "kaart", naam: "Visa · Mastercard" },
];

function Slot({ methode, donker }: { methode: Methode; donker: boolean }) {
  const rand = donker ? "border-kastwit/20" : "border-railstaal/60";
  const tekst = donker ? "text-kastwit/80" : "text-staal-tekst";

  return (
    <li
      className={`flex h-9 items-center justify-center rounded-lg border ${rand} px-3`}
      // De naam staat er zichtbaar; een title zou hem dubbel voorlezen.
    >
      {methode.logo ? (
        <Image
          src={`/media/betaalmethoden/${methode.slug}.svg`}
          alt={methode.naam}
          width={44}
          height={20}
          className="h-5 w-auto"
        />
      ) : (
        <span className={`data whitespace-nowrap text-[11px] ${tekst}`}>
          {methode.naam}
        </span>
      )}
    </li>
  );
}

/** Slotje. Geen losse afbeelding: één pad schaalt scherper dan een icoonfont. */
function Slotje({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      className={className}
      aria-hidden
    >
      <rect x="4" y="10" width="16" height="10" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function Betaalmethoden({ donker = false }: { donker?: boolean }) {
  const label = donker ? "text-kastwit/55" : "text-staal-tekst";

  return (
    <div>
      <div className="flex items-center gap-2">
        {/* zweeft rustig op en neer; staat stil bij prefers-reduced-motion */}
        <span className={donker ? "text-kastwit zweef" : "text-antraciet zweef"}>
          <Slotje />
        </span>
        <p className={`data text-[11px] uppercase tracking-widest ${label}`}>
          Veilig betalen via Stripe
        </p>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {METHODEN.map((m) => (
          <Slot key={m.slug} methode={m} donker={donker} />
        ))}
      </ul>

      <p className={`mt-3 text-xs ${donker ? "text-kastwit/50" : "text-staal-tekst"}`}>
        Je betaalgegevens komen nooit op onze servers — je rekent af op de
        beveiligde pagina van Stripe.
      </p>
    </div>
  );
}
