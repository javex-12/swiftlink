import { describe, expect, it } from "vitest";
import { csvField, csvFilename, toCsv, type CsvColumn } from "../csv";

/**
 * Escaping is the whole point of this module. A customer name with a comma or a
 * quote must not shift the columns, and a value starting with `=` must not run as
 * a formula in the merchant's spreadsheet.
 */
describe("csvField", () => {
  it("leaves ordinary values alone", () => {
    expect(csvField("Ada")).toBe("Ada");
    expect(csvField(42)).toBe("42");
  });

  it("quotes values containing commas, quotes or newlines", () => {
    expect(csvField("Ade, Bola")).toBe('"Ade, Bola"');
    expect(csvField('He said "hi"')).toBe('"He said ""hi"""');
    expect(csvField("line one\nline two")).toBe('"line one\nline two"');
  });

  it("neutralises spreadsheet formulas", () => {
    expect(csvField("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(csvField("+2348012345678")).toBe("'+2348012345678");
    expect(csvField("-2")).toBe("'-2");
    expect(csvField("@handle")).toBe("'@handle");
  });

  it("renders null and undefined as an empty field, not the word", () => {
    expect(csvField(null)).toBe("");
    expect(csvField(undefined)).toBe("");
  });
});

describe("toCsv", () => {
  it("writes a header and one row per record, with CRLF endings", () => {
    type Row = { name: string; amount: number };
    const columns: CsvColumn<Row>[] = [
      { header: "Customer", value: (row) => row.name },
      { header: "Amount", value: (row) => row.amount },
    ];
    const csv = toCsv(
      [
        { name: "Ada", amount: 19 },
        { name: "Ade, Bola", amount: 5 },
      ],
      columns,
    );

    expect(csv).toBe('Customer,Amount\r\nAda,19\r\n"Ade, Bola",5\r\n');
  });

  it("handles an empty export without dropping the header", () => {
    const columns: CsvColumn<{ id: string }>[] = [{ header: "Order ref", value: (row) => row.id }];
    expect(toCsv([], columns)).toBe("Order ref\r\n");
  });
});

describe("csvFilename", () => {
  it("dates the file so repeated exports do not overwrite each other", () => {
    expect(csvFilename("orders", new Date("2026-10-17T10:00:00Z"))).toBe("orders-2026-10-17.csv");
  });
});
