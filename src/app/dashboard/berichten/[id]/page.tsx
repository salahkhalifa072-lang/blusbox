import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { contactberichtMetAntwoorden, markeerGelezen } from "@/db/contact";
import { Antwoordformulier } from "../formulieren";
import { zetStatus } from "../acties";

export const metadata: Metadata = {
  title: "Bericht",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const tijd = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});

function StatusKnop({ id, status, tekst }: { id: string; status: string; tekst: string }) {
  return (
    <form action={zetStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className="rounded-full border border-antraciet/30 px-4 py-2 text-xs hover:bg-antraciet hover:text-kastwit"
      >
        {tekst}
      </button>
    </form>
  );
}

export default async function BerichtPagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gevonden = await contactberichtMetAntwoorden(id);
  if (!gevonden) notFound();
  const { bericht, antwoorden } = gevonden;
  if (!bericht.gelezenOp) await markeerGelezen(id);

  return (
    <div className="max-w-3xl space-y-8">
      <Link href="/dashboard/berichten" className="data text-xs text-staal-tekst underline underline-offset-4">
        ← Alle berichten
      </Link>

      <article className="rounded-2xl border border-railstaal/50 bg-kastwit p-5 sm:p-6">
        <p className="data text-xs uppercase tracking-widest text-staal-tekst">
          {bericht.onderwerp}
          {bericht.bron === "handmatig" ? " · overgenomen uit mail" : " · via contactformulier"}
        </p>
        <h1 className="font-display mt-2 text-2xl">{bericht.naam}</h1>
        <p className="data mt-1 text-sm">
          <a href={`mailto:${bericht.email}`} className="underline underline-offset-4">
            {bericht.email}
          </a>
          <span className="text-staal-tekst"> · {tijd.format(bericht.ontvangenOp)}</span>
        </p>
        <p className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed">{bericht.bericht}</p>
      </article>

      {antwoorden.map((a) => (
        <article key={a.id} className="ml-6 rounded-2xl border border-antraciet/15 bg-kastwit-dim p-5 sm:ml-10">
          <p className="data text-xs text-staal-tekst">
            Antwoord · {tijd.format(a.verstuurdOp)} · door {a.verstuurdDoor}
          </p>
          <p className="mt-1 text-sm font-medium">{a.onderwerp}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{a.tekst}</p>
        </article>
      ))}

      <section className="space-y-3">
        <h2 className="font-medium">{antwoorden.length > 0 ? "Nog een antwoord sturen" : "Beantwoorden"}</h2>
        <Antwoordformulier id={bericht.id} email={bericht.email} onderwerp={bericht.onderwerp} />
      </section>

      <div className="flex flex-wrap gap-2 border-t border-railstaal/40 pt-6">
        {bericht.status !== "gearchiveerd" ? (
          <StatusKnop id={bericht.id} status="gearchiveerd" tekst="Archiveren" />
        ) : (
          <StatusKnop id={bericht.id} status="nieuw" tekst="Terugzetten naar open" />
        )}
        {bericht.status === "beantwoord" ? (
          <StatusKnop id={bericht.id} status="nieuw" tekst="Weer op open zetten" />
        ) : null}
        {bericht.status === "nieuw" ? (
          <StatusKnop id={bericht.id} status="beantwoord" tekst="Afgehandeld zonder mail" />
        ) : null}
      </div>
    </div>
  );
}
