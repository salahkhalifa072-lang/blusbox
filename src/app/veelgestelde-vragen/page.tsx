import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { SiteFooter } from "@/components/site/footer";
import { FaqList } from "@/components/ui/accordion";
import { faq } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Veelgestelde vragen",
  description:
    "Antwoorden over werking, montage, levensduur, residu en verzending van de Blusbox-blusmodule voor de meterkast.",
  alternates: { canonical: "/veelgestelde-vragen" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({
    "@type": "Question",
    name: f.vraag,
    acceptedAnswer: { "@type": "Answer", text: f.antwoord },
  })),
};

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="vragen"
        title="Veelgestelde"
        accent="vragen"
        lead="Staat je vraag er niet bij? Stel hem via contact — je krijgt binnen één werkdag antwoord van iemand die het product kent."
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <FaqList items={faq} />
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="rounded-full bg-blusrood px-6 py-3 text-sm font-medium text-kastwit transition-colors hover:bg-[#b81e1b]"
          >
            Stel je vraag
          </Link>
          <Link
            href="/hoe-het-werkt"
            className="rounded-full border border-antraciet px-6 py-3 text-sm transition-colors hover:bg-antraciet hover:text-kastwit"
          >
            Hoe het werkt
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
