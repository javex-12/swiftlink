/**
 * CSV export.
 *
 * Written by hand rather than pulled from a package because the only hard part is
 * escaping, and getting it wrong is not cosmetic: a customer name containing a
 * comma or a quote silently shifts every following column, and a leading `=` or
 * `+` is executed as a formula by Excel and Sheets. Both are handled here, and
 * the result opens in a spreadsheet rather than in one cell.
 */

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

/** Quote a field, and defuse spreadsheet formulas in text values. */
export function csvField(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  const raw = String(input);

  // Formula injection: a value that starts with one of these is a formula to a
  // spreadsheet. Prefixing with an apostrophe keeps it as text.
  const neutralised = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;

  if (/[",\n\r]/.test(neutralised)) {
    return `"${neutralised.replace(/"/g, '""')}"`;
  }
  return neutralised;
}

export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const header = columns.map((column) => csvField(column.header)).join(",");
  const body = rows.map((row) =>
    columns.map((column) => csvField(column.value(row))).join(","),
  );
  // CRLF is what Excel expects; Sheets and Numbers read it too.
  return [header, ...body].join("\r\n") + "\r\n";
}

/**
 * Hand a CSV to the browser as a download.
 *
 * The BOM is deliberate: Excel on Windows reads a UTF-8 file without it as the
 * system codepage, which turns `₦` and accented names into mojibake.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a tick to start the download before the URL is released.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** `orders-2026-10-17.csv` — dated so repeated exports do not overwrite. */
export function csvFilename(prefix: string, now: Date = new Date()): string {
  const stamp = now.toISOString().slice(0, 10);
  return `${prefix}-${stamp}.csv`;
}
