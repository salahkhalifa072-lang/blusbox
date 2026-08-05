import type { ReactNode } from "react";

/**
 * Text-page wrapper for legal and service pages. Styles descendants
 * directly so page bodies stay plain semantic HTML.
 */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        mx-auto max-w-2xl px-6 py-20
        [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-blusrood-op-licht
        [&_h2]:font-display [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:first:mt-0
        [&_h3]:mt-8 [&_h3]:font-medium
        [&_li]:text-staal-tekst
        [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5
        [&_p]:mt-4 [&_p]:leading-relaxed [&_p]:text-staal-tekst
        [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5
      "
    >
      {children}
    </div>
  );
}

/**
 * Marks a page whose text still needs client or legal sign-off, so an
 * unreviewed draft can never be mistaken for a final legal document.
 */
export function DraftNotice({ what }: { what: string }) {
  return (
    <aside
      className="mb-10 rounded-2xl border border-signaal bg-signaal/15 p-5"
      role="note"
    >
      <p className="data text-xs uppercase tracking-widest">
        Nog niet definitief
      </p>
      <p className="mt-2 text-sm leading-relaxed text-antraciet">
        Deze tekst is een opzet en moet vóór livegang worden aangevuld en
        juridisch gecontroleerd: {what}
      </p>
    </aside>
  );
}
