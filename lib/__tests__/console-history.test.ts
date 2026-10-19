import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  LAST_CONSOLE_PATH_KEY,
  isConsolePath,
  readLastConsolePath,
  rememberConsolePath,
} from "../console-history";

/**
 * The installed app opened on the marketing landing page on every launch, which
 * is the wrong room for a merchant who installed a console. These pin the two
 * halves of the fix: a launch route that resumes where they were, and a console
 * that records it.
 */

function memoryStorage(seed: Record<string, string> = {}) {
  const data = { ...seed };
  return {
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    dump: () => data,
  };
}

describe("isConsolePath", () => {
  it("accepts the console sections, including nested routes and queries", () => {
    expect(isConsolePath("/pro")).toBe(true);
    expect(isConsolePath("/pro/inquiries")).toBe(true);
    expect(isConsolePath("/pro/analytics?range=30")).toBe(true);
    expect(isConsolePath("/account")).toBe(true);
    expect(isConsolePath("/business")).toBe(true);
  });

  it("refuses anything that is not part of the console", () => {
    expect(isConsolePath("/")).toBe(false);
    expect(isConsolePath("/cyd-store")).toBe(false);
    expect(isConsolePath("/stores?q=cyd")).toBe(false);
    expect(isConsolePath("https://evil.example/pro")).toBe(false);
    expect(isConsolePath("")).toBe(false);
    // A prefix that merely looks like one must not match.
    expect(isConsolePath("/producer")).toBe(false);
    expect(isConsolePath("/accountant")).toBe(false);
  });
});

describe("rememberConsolePath / readLastConsolePath", () => {
  it("round-trips a console path", () => {
    const storage = memoryStorage();
    rememberConsolePath("/pro/inquiries", storage);
    expect(readLastConsolePath(storage)).toBe("/pro/inquiries");
    expect(storage.dump()[LAST_CONSOLE_PATH_KEY]).toBe("/pro/inquiries");
  });

  it("never records a storefront as the app's home", () => {
    const storage = memoryStorage({ [LAST_CONSOLE_PATH_KEY]: "/pro" });
    rememberConsolePath("/cyd-store", storage);
    expect(readLastConsolePath(storage)).toBe("/pro");
  });

  it("ignores a stored value that is not a console path", () => {
    expect(readLastConsolePath(memoryStorage({ [LAST_CONSOLE_PATH_KEY]: "/signup" }))).toBeNull();
    expect(readLastConsolePath(memoryStorage())).toBeNull();
  });

  it("survives storage being unavailable", () => {
    const hostile = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() => rememberConsolePath("/pro", hostile)).not.toThrow();
    expect(readLastConsolePath(hostile)).toBeNull();
  });
});

describe("the launch route and the console agree", () => {
  const launch = readFileSync(new URL("../../app/launch/page.tsx", import.meta.url), "utf8");
  const layout = readFileSync(new URL("../../components/ProLayout.tsx", import.meta.url), "utf8");
  const manifest = readFileSync(new URL("../../app/manifest.ts", import.meta.url), "utf8");

  it("starts the installed app at /launch, not the landing page", () => {
    expect(manifest).toContain('start_url: "/launch?source=pwa"');
  });

  it("resumes the recorded screen, falling back to the console home", () => {
    expect(launch).toContain("readLastConsolePath() ?? \"/pro\"");
  });

  it("is recorded by the console shell, which every console page renders inside", () => {
    expect(layout).toContain("rememberConsolePath(pathname");
    for (const page of ["app/account/page.tsx", "app/business/page.tsx"]) {
      expect(readFileSync(new URL(`../../${page}`, import.meta.url), "utf8")).toContain("ProLayout");
    }
  });
});
