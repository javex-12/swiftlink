import { describe, expect, it } from "vitest";
import {
  cnameMatches,
  cnameTarget,
  dnsInstructions,
  domainProblem,
  normalizeDomain,
  verificationRecordName,
} from "../domains";

/**
 * A hostname is stored once and matched in three places (the form, the DNS check
 * and middleware), so normalisation is the thing that has to be boring and total:
 * whatever a merchant pastes must either become the same canonical string every
 * time, or be refused with a message they can act on.
 */
describe("normalizeDomain", () => {
  it("accepts what people actually paste", () => {
    expect(normalizeDomain("shop.example.com")).toBe("shop.example.com");
    expect(normalizeDomain("  Shop.Example.COM  ")).toBe("shop.example.com");
    expect(normalizeDomain("https://shop.example.com/")).toBe("shop.example.com");
    expect(normalizeDomain("http://shop.example.com/a/b?x=1")).toBe("shop.example.com");
    expect(normalizeDomain("shop.example.com.")).toBe("shop.example.com");
    expect(normalizeDomain("shop.example.com:8443")).toBe("shop.example.com");
  });

  it("treats www. as the same domain, so both cannot be claimed", () => {
    expect(normalizeDomain("www.example.com")).toBe("example.com");
  });

  it("refuses things that are not a merchant hostname", () => {
    expect(normalizeDomain("")).toBeNull();
    expect(normalizeDomain(null)).toBeNull();
    expect(normalizeDomain("localhost")).toBeNull();
    expect(normalizeDomain("127.0.0.1")).toBeNull();
    expect(normalizeDomain("bad_host.example.com")).toBeNull();
    expect(normalizeDomain("-leading.example.com")).toBeNull();
    expect(normalizeDomain("example")).toBeNull();
  });

  it("keeps the platform's own hostnames for the platform", () => {
    expect(normalizeDomain("swiftlinkpro.vercel.app")).toBeNull();
    expect(normalizeDomain(`x.${cnameTarget()}`)).toBeNull();
    expect(normalizeDomain("anything.supabase.co")).toBeNull();
  });

  it("explains a refusal instead of failing silently", () => {
    expect(domainProblem("")).toMatch(/enter a domain/i);
    expect(domainProblem("https://shop.example.com/path")).toBeNull();
    expect(domainProblem("not a domain")).toMatch(/hostname/i);
  });
});

describe("cnameMatches", () => {
  it("ignores case and the trailing dot DNS answers carry", () => {
    expect(cnameMatches([`${cnameTarget()}.`])).toBe(true);
    expect(cnameMatches([cnameTarget().toUpperCase()])).toBe(true);
  });

  it("does not accept another host's record", () => {
    expect(cnameMatches(["somewhere-else.example.net"])).toBe(false);
    expect(cnameMatches([])).toBe(false);
  });
});

describe("the records a merchant is told to create", () => {
  it("names the CNAME target and a per-domain TXT record", () => {
    const records = dnsInstructions("Shop.Example.com");
    expect(records[0]).toEqual({ type: "CNAME", name: "shop.example.com", value: cnameTarget() });
    expect(records[1].name).toBe(verificationRecordName("shop.example.com"));
    expect(records[1].name.startsWith("_swiftlink-verify.")).toBe(true);
  });
});
