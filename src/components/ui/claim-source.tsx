/**
 * Claim-source footnote (§1). Every content block may carry a bronUrl +
 * bronOmschrijving; this renders the footnote line. B2B trust device,
 * not a compliance chore.
 */
export function ClaimSource({
  url,
  label,
}: {
  url?: string | null;
  label?: string | null;
}) {
  if (!url && !label) return null;
  return (
    <p className="data mt-2 text-xs text-staal-tekst">
      Bron:{" "}
      {url ? (
        <a
          href={url}
          className="underline underline-offset-2 hover:text-antraciet"
          rel="noopener noreferrer"
          target="_blank"
        >
          {label ?? url}
        </a>
      ) : (
        label
      )}
    </p>
  );
}
