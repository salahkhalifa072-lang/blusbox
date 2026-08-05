import type { FaqItem } from "@/lib/faq";

/**
 * Native <details> accordion — keyboard-complete and screen-reader safe
 * without a line of JavaScript.
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-railstaal/50 border-y border-railstaal/50">
      {items.map((item) => (
        <details key={item.vraag} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-medium marker:hidden">
            <span>{item.vraag}</span>
            <span
              className="data shrink-0 text-xl text-staal-tekst transition-transform group-open:rotate-45"
              aria-hidden
            >
              +
            </span>
          </summary>
          <p className="max-w-2xl pb-5 text-sm leading-relaxed text-staal-tekst">
            {item.antwoord}
          </p>
        </details>
      ))}
    </div>
  );
}
