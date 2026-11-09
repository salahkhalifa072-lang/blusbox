import Link from "next/link";
import { FaqList } from "@/components/ui/accordion";
import { SectieLabel } from "@/components/ui/sectielabel";
import { Reveal } from "@/components/ui/reveal";
import { faq } from "@/lib/faq";

/**
 * De koopvragen op de homepage zelf.
 *
 * Wie twijfelt gaat niet naar een aparte vragenpagina; die scrolt nog even
 * door en haakt anders af. Dezelfde antwoorden als op
 * /veelgestelde-vragen, uit dezelfde lijst, zodat ze nooit uiteenlopen.
 *
 * Met FAQPage-gegevens, zodat zoekmachines en AI-assistenten de antwoorden
 * kunnen oppikken. Alleen voor wat hier ook zichtbaar staat.
 */
const VRAGEN = [
  "Past Blusbox in mijn meterkast?",
  "Mag ik Blusbox zelf monteren?",
  "Heeft Blusbox stroom of een batterij nodig?",
  "Beschadigt het blusmiddel mijn installatie?",
  "Hoe lang gaat een module mee?",
  "Vervangt Blusbox mijn rookmelders of aardlekschakelaar?",
];

const items = VRAGEN.flatMap((v) => faq.filter((f) => f.vraag === v));

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((f) => ({
    "@type": "Question",
    name: f.vraag,
    acceptedAnswer: { "@type": "Answer", text: f.antwoord },
  })),
};

export function HomepageVragen() {
  return (
    <section className="py-14 sm:py-24" aria-labelledby="vragen-kop">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[1fr_1.6fr] lg:gap-12">
        <Reveal>
          <SectieLabel>vragen</SectieLabel>
          <h2 id="vragen-kop" className="font-display mt-4 text-[clamp(2rem,5vw,3.5rem)]">
            Nog <span className="accent">twijfels?</span>
          </h2>
          <p className="mt-4 max-w-sm text-staal-tekst">
            Staat je vraag er niet bij? Je krijgt binnen één werkdag antwoord
            van iemand die het product kent.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-full bg-antraciet px-6 py-3 text-sm font-medium text-kastwit transition-opacity hover:opacity-85"
            >
              Stel je vraag
            </Link>
            <Link
              href="/veelgestelde-vragen"
              className="rounded-full border border-antraciet px-6 py-3 text-sm transition-colors hover:bg-antraciet hover:text-kastwit"
            >
              Alle vragen
            </Link>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <FaqList items={items} />
        </Reveal>
      </div>
    </section>
  );
}
