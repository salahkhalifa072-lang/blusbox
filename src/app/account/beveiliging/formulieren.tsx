"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { CodeStaat } from "./acties";

const LEEG: CodeStaat = { fase: "leeg" };

function Knop({ children, gevaar = false }: { children: string; gevaar?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-full px-6 py-3 text-sm font-medium transition-colors disabled:opacity-60 ${
        gevaar
          ? "border border-antraciet/30 text-antraciet hover:bg-antraciet hover:text-kastwit"
          : "bg-blusrood-vlak text-kastwit hover:bg-[#9e1b18]"
      }`}
    >
      {pending ? "Bezig…" : children}
    </button>
  );
}

function CodeVeld({ id, label }: { id: string; label: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]{6,7}"
        maxLength={7}
        required
        placeholder="123456"
        className="data mt-1.5 w-full max-w-[12rem] rounded-[var(--radius-control)] border border-railstaal bg-kastwit px-4 py-3 text-lg tracking-[0.3em]"
      />
    </div>
  );
}

function Fout({ staat }: { staat: CodeStaat }) {
  if (staat.fase !== "fout") return null;
  return (
    <p role="alert" className="rounded-xl border border-signaal bg-signaal/15 px-4 py-3 text-sm">
      {staat.melding}
    </p>
  );
}

/**
 * Herstelcodes worden één keer getoond. Daarom een kopieerknop en een
 * downloadknop: overtypen van acht codes gaat gegarandeerd ergens mis.
 */
export function Herstelcodes({ codes }: { codes: string[] }) {
  const [gekopieerd, setGekopieerd] = useState(false);
  const tekst = `Blusbox herstelcodes (elke code werkt één keer)\n\n${codes.join("\n")}\n`;
  return (
    <div className="rounded-2xl border border-railstaal bg-kastwit p-5">
      <p className="font-medium">Bewaar deze herstelcodes</p>
      <p className="mt-1 text-sm text-staal-tekst">
        Ben je je telefoon kwijt, dan log je hiermee in. Ze worden maar één keer
        getoond. Bewaar ze buiten je telefoon, bijvoorbeeld in je
        wachtwoordmanager of geprint.
      </p>
      <ul className="data mt-4 grid grid-cols-2 gap-2 text-base">
        {codes.map((c) => (
          <li key={c} className="rounded-lg bg-kastwit-dim px-3 py-2 text-center">
            {c}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            navigator.clipboard?.writeText(tekst).then(() => setGekopieerd(true))
          }
          className="rounded-full border border-antraciet/30 px-4 py-2 text-sm hover:bg-antraciet hover:text-kastwit"
        >
          {gekopieerd ? "Gekopieerd" : "Kopiëren"}
        </button>
        <a
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(tekst)}`}
          download="blusbox-herstelcodes.txt"
          className="rounded-full border border-antraciet/30 px-4 py-2 text-sm hover:bg-antraciet hover:text-kastwit"
        >
          Downloaden
        </a>
      </div>
      <Link
        href="/account"
        className="mt-6 inline-block rounded-full bg-blusrood-vlak px-6 py-3 text-sm font-medium text-kastwit hover:bg-[#9e1b18]"
      >
        Ik heb ze bewaard
      </Link>
    </div>
  );
}

/**
 * `uitleg` (stappen en QR-code) en `onder` (annuleren) verdwijnen zodra de
 * koppeling klaar is; dan staan alleen de herstelcodes nog in beeld.
 */
export function Koppelen({
  actie,
  uitleg,
  onder,
}: {
  actie: (s: CodeStaat, f: FormData) => Promise<CodeStaat>;
  uitleg: ReactNode;
  onder: ReactNode;
}) {
  const [staat, verstuur] = useActionState(actie, LEEG);
  if (staat.fase === "klaar") {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-antraciet/20 bg-kastwit-dim px-4 py-3 text-sm font-medium">
          Tweestapsverificatie staat aan. Vanaf nu vraagt inloggen ook een code
          uit de app.
        </p>
        <Herstelcodes codes={staat.herstelcodes} />
      </div>
    );
  }
  return (
    <>
      {uitleg}
      <form action={verstuur} className="space-y-4">
        <CodeVeld id="code-koppelen" label="3. Typ de code die de app nu laat zien" />
        <Fout staat={staat} />
        <Knop>Aanzetten</Knop>
      </form>
      {onder}
    </>
  );
}

export function NieuweHerstelcodes({
  actie,
}: {
  actie: (s: CodeStaat, f: FormData) => Promise<CodeStaat>;
}) {
  const [staat, verstuur] = useActionState(actie, LEEG);
  if (staat.fase === "klaar") return <Herstelcodes codes={staat.herstelcodes} />;
  return (
    <form action={verstuur} className="space-y-4">
      <CodeVeld id="code-herstel" label="Code uit de app" />
      <Fout staat={staat} />
      <Knop>Nieuwe herstelcodes maken</Knop>
    </form>
  );
}

export function Uitzetten({
  actie,
}: {
  actie: (s: CodeStaat, f: FormData) => Promise<CodeStaat>;
}) {
  const [staat, verstuur] = useActionState(actie, LEEG);
  return (
    <form action={verstuur} className="space-y-4">
      <CodeVeld id="code-uit" label="Code uit de app" />
      <Fout staat={staat} />
      <Knop gevaar>Tweestapsverificatie uitzetten</Knop>
    </form>
  );
}
