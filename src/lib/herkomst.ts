/**
 * Waar een bestelling vandaan kwam.
 *
 * Bij binnenkomst op de site kijken we naar de link waarmee iemand kwam
 * (utm-labels, het soort advertentieklik) en naar de site waar hij
 * vandaan klikte. Dat gaat in een cookie, en bij het afrekenen gaat die
 * mee op de bestelling. Zo zie je in het dashboard per bestelling of hij
 * uit Facebook, Google, een partner of van iemand die het adres intypte
 * kwam.
 *
 * Wat er níét in gaat: klik-ID's (gclid, fbclid en dergelijke). Die zijn
 * per persoon uniek en bedoeld om een bezoek terug te koppelen aan een
 * advertentieprofiel. Wij kijken alleen óf er zo'n ID in de link stond,
 * om te weten dat het een advertentieklik was, en gooien de waarde weg.
 * Van de verwijzende site bewaren we alleen de domeinnaam, niet de pagina
 * (daar kan een zoekterm of profielnaam in staan).
 *
 * Puur rekenwerk zonder Node-modules: dit draait ook in de middleware.
 */

export const HERKOMST_COOKIE = "bb_herkomst";
/** Dertig dagen: lang genoeg voor wie eerst rondkijkt en later bestelt. */
export const HERKOMST_MAX_LEEFTIJD = 60 * 60 * 24 * 30;

export type Herkomst = {
  /** Bijvoorbeeld facebook, google, instagram, of een domeinnaam. */
  bron: string;
  /** cpc, social, zoeken, verwijzing, gratis-vermelding, direct, … */
  medium: string;
  campagne?: string;
  /** utm_content: welke advertentie binnen de campagne. */
  inhoud?: string;
  /** Alleen het domein van de verwijzende site. */
  verwijzer?: string;
  /** Pad van de eerste pagina, zonder querystring. */
  landing?: string;
  /** Milliseconden sinds epoch: wanneer deze herkomst is vastgelegd. */
  op: number;
};

/** Wat een bestelling krijgt als er geen herkomst bekend is. */
export function directeHerkomst(nu = Date.now()): Herkomst {
  return { bron: "direct", medium: "direct", op: nu };
}

/* --------------------------------------------------------- opschonen */

/** Kort, kleine letters, alleen veilige tekens. Rommel wordt leeg. */
function label(waarde: string | null | undefined, max = 60): string | undefined {
  if (!waarde) return undefined;
  const schoon = waarde
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._\-+/]/g, "")
    .slice(0, max);
  return schoon || undefined;
}

function pad(waarde: string | undefined): string | undefined {
  if (!waarde) return undefined;
  const schoon = waarde.replace(/[^A-Za-z0-9/_\-.]/g, "").slice(0, 100);
  return schoon || undefined;
}

function hostVan(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/* ---------------------------------------------------- herkennen */

/** Zoekmachines: komt iemand daarvandaan zonder advertentie-ID, dan is het gratis zoekverkeer. */
const ZOEKMACHINES: [RegExp, string][] = [
  [/(^|\.)google\.[a-z.]+$/, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)ecosia\.org$/, "ecosia"],
  [/(^|\.)yahoo\.[a-z.]+$/, "yahoo"],
  [/(^|\.)startpage\.com$/, "startpage"],
  [/(^|\.)qwant\.com$/, "qwant"],
];

const SOCIAL: [RegExp, string][] = [
  [/(^|\.)facebook\.com$|(^|\.)fb\.(com|me)$/, "facebook"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)t\.co$|(^|\.)x\.com$|(^|\.)twitter\.com$/, "x"],
  [/(^|\.)linkedin\.com$|(^|\.)lnkd\.in$/, "linkedin"],
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, "youtube"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)pinterest\.[a-z.]+$/, "pinterest"],
  [/(^|\.)reddit\.com$/, "reddit"],
  [/(^|\.)whatsapp\.com$/, "whatsapp"],
];

const AI: [RegExp, string][] = [
  [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, "chatgpt"],
  [/(^|\.)perplexity\.ai$/, "perplexity"],
  [/(^|\.)gemini\.google\.com$/, "gemini"],
  [/(^|\.)copilot\.microsoft\.com$/, "copilot"],
  [/(^|\.)claude\.ai$/, "claude"],
];

/**
 * Sites waar een klant langs komt tijdens het betalen. Wie daarvandaan
 * terugkomt, komt niet "van Stripe" of "van de bank": dan laten we de
 * herkomst staan die er al was.
 */
const NEGEREN =
  /(^|\.)(stripe\.com|mollie\.com|paypal\.com|klarna\.com|ideal\.nl|ing\.nl|rabobank\.nl|abnamro\.nl|asnbank\.nl|snsbank\.nl|regiobank\.nl|triodos\.nl|bunq\.com|knab\.nl|revolut\.com|vercel\.app|vercel\.com|accounts\.google\.com)$/;

function decodeURIComponentVeilig(t: string): string {
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}

function zoek(lijst: [RegExp, string][], host: string): string | undefined {
  return lijst.find(([re]) => re.test(host))?.[1];
}

/**
 * De herkomst van één binnenkomst, of null als deze binnenkomst niets
 * nieuws zegt (intern doorklikken, intypen, terug van de betaalpagina).
 * Bij null blijft een eerder vastgelegde herkomst gewoon staan.
 */
export function bepaalHerkomst(invoer: {
  url: string;
  verwijzer?: string | null;
  /** Domeinen die bij onze eigen site horen. */
  eigenHosts?: string[];
  nu?: number;
}): Herkomst | null {
  let url: URL;
  try {
    url = new URL(invoer.url);
  } catch {
    return null;
  }
  const p = url.searchParams;
  const nu = invoer.nu ?? Date.now();
  const landing = pad(url.pathname);

  const eigen = new Set(
    [url.hostname, ...(invoer.eigenHosts ?? [])].map((h) => h.toLowerCase().replace(/^www\./, "")),
  );
  const ruweHost = hostVan(invoer.verwijzer);
  const verwijzer = ruweHost && !eigen.has(ruweHost) ? ruweHost : null;

  const basis = { landing, op: nu, ...(verwijzer ? { verwijzer } : {}) };

  // 0. Een partnerlink (/r/<slug>): de partner is de bron, waar hij de
  //    link ook geplaatst heeft.
  const partner = url.pathname.match(/^\/r\/([^/]+)\/?$/);
  if (partner) {
    const slug = label(decodeURIComponentVeilig(partner[1]));
    if (slug) return { bron: slug, medium: "partner", ...basis };
  }

  // 1. Zelf gelabelde links (advertenties, nieuwsbrief, QR-code op de doos).
  const utmBron = label(p.get("utm_source"));
  if (utmBron) {
    const campagne = label(p.get("utm_campaign"), 80);
    const inhoud = label(p.get("utm_content"), 80);
    return {
      bron: utmBron,
      medium: label(p.get("utm_medium")) ?? "onbekend",
      ...(campagne ? { campagne } : {}),
      ...(inhoud ? { inhoud } : {}),
      ...basis,
    };
  }

  // 2. Advertentieklikken die het platform zelf markeert.
  if (p.has("gclid") || p.has("gbraid") || p.has("wbraid")) {
    return { bron: "google", medium: "cpc", ...basis };
  }
  if (p.has("msclkid")) return { bron: "bing", medium: "cpc", ...basis };
  if (p.has("ttclid")) return { bron: "tiktok", medium: "cpc", ...basis };

  // 3. Google Merchant Center zet srsltid op gratis productvermeldingen.
  if (p.has("srsltid")) return { bron: "google", medium: "gratis-vermelding", ...basis };

  // 4. Facebook en Instagram zetten fbclid op élke uitgaande link, ook op
  //    gewone berichten. Dus: van Meta, maar niet per se een advertentie.
  if (p.has("fbclid")) {
    const bron = verwijzer && /instagram/.test(verwijzer) ? "instagram" : "facebook";
    return { bron, medium: "social", ...basis };
  }

  // 5. Alleen een verwijzende site.
  if (!verwijzer || NEGEREN.test(verwijzer)) return null;

  const ai = zoek(AI, verwijzer);
  if (ai) return { bron: ai, medium: "ai", ...basis };
  const zoekmachine = zoek(ZOEKMACHINES, verwijzer);
  if (zoekmachine) return { bron: zoekmachine, medium: "zoeken", ...basis };
  const social = zoek(SOCIAL, verwijzer);
  if (social) return { bron: social, medium: "social", ...basis };

  return { bron: verwijzer, medium: "verwijzing", ...basis };
}

/* ------------------------------------------------------ cookie */

/** Gewoon JSON; Next.js codeert de cookiewaarde zelf al. */
export function schrijfHerkomst(h: Herkomst): string {
  return JSON.stringify(h);
}

function parse(waarde: string): unknown {
  try {
    return JSON.parse(waarde);
  } catch {
    try {
      return JSON.parse(decodeURIComponent(waarde));
    } catch {
      return null;
    }
  }
}

/**
 * Leest de cookie. De bezoeker kan hem zelf aanpassen; dat is hier geen
 * probleem (er hangt geen geld aan, anders dan bij de affiliatecookie),
 * maar alles gaat wel opnieuw door de opschoning, zodat er nooit iets
 * vreemds in de database of het dashboard belandt.
 */
export function leesHerkomstWaarde(waarde: string | undefined): Herkomst | null {
  if (!waarde) return null;
  const ruw = parse(waarde);
  if (!ruw || typeof ruw !== "object" || Array.isArray(ruw)) return null;
  const r = ruw as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === "string" ? v : undefined);
  const bron = label(s(r.bron));
  if (!bron) return null;
  const op = typeof r.op === "number" && Number.isFinite(r.op) ? r.op : Date.now();
  const campagne = label(s(r.campagne), 80);
  const inhoud = label(s(r.inhoud), 80);
  const verwijzer = label(s(r.verwijzer), 80);
  const landing = pad(s(r.landing));
  return {
    bron,
    medium: label(s(r.medium)) ?? "onbekend",
    ...(campagne ? { campagne } : {}),
    ...(inhoud ? { inhoud } : {}),
    ...(verwijzer ? { verwijzer } : {}),
    ...(landing ? { landing } : {}),
    op,
  };
}

/* ---------------------------------------------------- tonen */

const NAMEN: Record<string, string> = {
  facebook: "Facebook",
  fb: "Facebook",
  instagram: "Instagram",
  ig: "Instagram",
  an: "Meta Audience Network",
  msg: "Messenger",
  meta: "Meta",
  google: "Google",
  bing: "Bing",
  duckduckgo: "DuckDuckGo",
  ecosia: "Ecosia",
  yahoo: "Yahoo",
  startpage: "Startpage",
  qwant: "Qwant",
  x: "X",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  reddit: "Reddit",
  whatsapp: "WhatsApp",
  chatgpt: "ChatGPT",
  "chatgpt.com": "ChatGPT",
  perplexity: "Perplexity",
  gemini: "Gemini",
  copilot: "Copilot",
  claude: "Claude",
  nieuwsbrief: "Nieuwsbrief",
  email: "E-mail",
  direct: "Direct",
};

const SOORTEN: Record<string, string> = {
  cpc: "advertentie",
  ppc: "advertentie",
  paid: "advertentie",
  "paid-social": "advertentie",
  paid_social: "advertentie",
  paidsocial: "advertentie",
  ads: "advertentie",
  ad: "advertentie",
  social: "social",
  zoeken: "zoeken",
  organic: "zoeken",
  "gratis-vermelding": "gratis productvermelding",
  verwijzing: "link op andere site",
  referral: "link op andere site",
  email: "e-mail",
  ai: "AI-assistent",
  partner: "partnerlink",
};

/**
 * Een korte, leesbare omschrijving voor het dashboard, bijvoorbeeld
 * "Facebook · advertentie" of "Google · zoeken".
 */
export function herkomstTekst(h: Herkomst | null | undefined): string {
  if (!h) return "Onbekend";
  if (h.bron === "direct") return "Direct of ingetypt";
  if (h.medium === "partner") return `Partner ${h.bron}`;
  const naam = NAMEN[h.bron] ?? h.bron;
  const soort = SOORTEN[h.medium] ?? (h.medium === "onbekend" ? null : h.medium);
  return soort ? `${naam} · ${soort}` : naam;
}

/** Groepering voor het overzicht: alleen de bron, met nette naam. */
export function herkomstGroep(h: Herkomst | null | undefined): string {
  if (!h) return "Onbekend (van vóór de registratie)";
  if (h.bron === "direct") return "Direct of ingetypt";
  const betaald = ["cpc", "ppc", "paid", "paid-social", "paid_social", "paidsocial", "ads", "ad"].includes(h.medium);
  const naam = NAMEN[h.bron] ?? h.bron;
  if (h.medium === "gratis-vermelding") return `${naam} Shopping (gratis)`;
  if (h.medium === "partner") return `Partner: ${h.bron}`;
  return betaald ? `${naam} (advertentie)` : naam;
}
