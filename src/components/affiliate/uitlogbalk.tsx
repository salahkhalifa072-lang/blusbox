/**
 * Wie ben ik, en hoe kom ik hier weg.
 *
 * Twee dingen die op elk ingelogd scherm horen te staan en op het
 * partnerdashboard ontbraken. Het e-mailadres erbij omdat iemand met twee
 * accounts anders niet ziet in welk dashboard hij kijkt, en de uitlogknop
 * omdat een gedeelde computer anders het dashboard open laat staan voor
 * de volgende gebruiker.
 */
export function Uitlogbalk({
  email,
  actie,
}: {
  email: string;
  actie: () => Promise<void>;
}) {
  return (
    <div className="hairline-t mt-10 flex flex-wrap items-center justify-between gap-3 pt-5">
      <p className="data text-xs text-staal-tekst">
        Ingelogd als <span className="text-antraciet">{email}</span>
      </p>
      <form action={actie}>
        <button
          type="submit"
          className="data rounded-full border border-antraciet px-4 py-1.5 text-xs transition-colors hover:bg-antraciet hover:text-kastwit"
        >
          Uitloggen
        </button>
      </form>
    </div>
  );
}
