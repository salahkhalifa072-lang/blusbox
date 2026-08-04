export type SpecRow = {
  label: string;
  value: string;
  /** Rendered in Geist Mono when the value is a measurable quantity */
  isData?: boolean;
};

/**
 * Hairline spec table. Values that are measurements render in the data
 * face — §6's "one rule that does most of the visual work".
 */
export function SpecTable({
  rows,
  caption,
}: {
  rows: SpecRow[];
  caption?: string;
}) {
  return (
    <table className="w-full border-collapse text-sm">
      {caption ? (
        <caption className="hairline-b pb-2 text-left font-display text-xs uppercase tracking-wider">
          {caption}
        </caption>
      ) : null}
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="hairline-b align-top">
            <th
              scope="row"
              className="w-1/3 py-3 pr-4 text-left font-normal text-staal-tekst"
            >
              {row.label}
            </th>
            <td className={`py-3 ${row.isData ? "data" : ""}`}>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
