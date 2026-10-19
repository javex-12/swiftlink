import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { storeMatchesQuery } from "../store-lookup";

/**
 * The directory is the one page that lets a shopper — and a search engine —
 * find a store by the name they know. Searching "cyd store" for a shop called
 * "Cyd" used to return nothing, because the query had to appear verbatim.
 */

const row = {
  bizName: "Cyd",
  handle: "cyd-store",
  tagline: "Sneakers and streetwear",
  location: "Lagos",
  categories: ["Sneakers", "Streetwear"],
};

describe("storeMatchesQuery", () => {
  it("finds a store when the shopper adds the word 'store'", () => {
    expect(storeMatchesQuery(row, "cyd store")).toBe(true);
    expect(storeMatchesQuery(row, "Cyd stores")).toBe(true);
    expect(storeMatchesQuery(row, "cyd shop")).toBe(true);
    expect(storeMatchesQuery(row, "CYD online")).toBe(true);
  });

  it("still matches on the name, handle, tagline and city", () => {
    expect(storeMatchesQuery(row, "cyd")).toBe(true);
    expect(storeMatchesQuery(row, "cyd-store")).toBe(true);
    expect(storeMatchesQuery(row, "streetwear")).toBe(true);
    expect(storeMatchesQuery(row, "lagos")).toBe(true);
    expect(storeMatchesQuery(row, "sneakers lagos")).toBe(true);
  });

  it("requires every meaningful word, so one query cannot return everything", () => {
    expect(storeMatchesQuery(row, "ada lagos")).toBe(false);
    expect(storeMatchesQuery(row, "cyd abuja")).toBe(false);
  });

  it("treats an empty or filler-only query as 'show everything'", () => {
    expect(storeMatchesQuery(row, "")).toBe(true);
    expect(storeMatchesQuery(row, "   ")).toBe(true);
    expect(storeMatchesQuery(row, "store")).toBe(true);
  });

  it("is what the directory actually calls", () => {
    const source = readFileSync(new URL("../store-lookup.ts", import.meta.url), "utf8");
    expect(source).toContain(".filter((store) => storeMatchesQuery(store, query))");
  });
});
