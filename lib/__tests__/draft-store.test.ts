import { describe, expect, it } from "vitest";
import {
  MAX_EDITOR_DRAFT_BYTES,
  describeDraftAge,
  editorDraftKey,
  hasDraftChanges,
  stableStringify,
} from "../draft-store";
import { defaultShopState } from "../types";

/**
 * `hasDraftChanges` decides whether an autosaved draft is offered back to the
 * merchant. A false positive pops up a "restore your work" banner over an
 * unchanged store; a false negative silently throws work away. Both are worse
 * than a wrong pixel, so the comparison is order-independent on purpose.
 */
describe("stableStringify", () => {
  it("ignores property insertion order", () => {
    expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }));
  });

  it("keeps array order significant", () => {
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]));
  });

  it("handles nested objects", () => {
    const left = { p: [{ name: "A", price: 1 }], meta: { x: 1, y: 2 } };
    const right = { meta: { y: 2, x: 1 }, p: [{ price: 1, name: "A" }] };
    expect(stableStringify(left)).toBe(stableStringify(right));
  });

  it("distinguishes null, undefined and missing keys", () => {
    expect(stableStringify({ a: null })).not.toBe(stableStringify({}));
    expect(stableStringify({ a: undefined })).toBe(stableStringify({}));
  });
});

describe("editorDraftKey", () => {
  it("namespaces the store id", () => {
    expect(editorDraftKey("store-1")).toBe("swiftlink_editor_draft_v1_store-1");
  });

  it("folds case and trims", () => {
    expect(editorDraftKey("  STORE-1 ")).toBe(editorDraftKey("store-1"));
  });

  it("returns null when there is no identity", () => {
    expect(editorDraftKey(null)).toBeNull();
    expect(editorDraftKey(undefined)).toBeNull();
    expect(editorDraftKey("   ")).toBeNull();
  });
});

describe("hasDraftChanges", () => {
  it("is false when the draft matches the live store", () => {
    const live = defaultShopState();
    expect(hasDraftChanges({ state: defaultShopState() }, live)).toBe(false);
  });

  it("is true after a single field edit", () => {
    const live = defaultShopState();
    const draft = { ...defaultShopState(), tagline: "Fresh drops every Friday" };
    expect(hasDraftChanges({ state: draft }, live)).toBe(true);
  });

  it("is false without both sides", () => {
    expect(hasDraftChanges(null, defaultShopState())).toBe(false);
    expect(hasDraftChanges({ state: defaultShopState() }, null)).toBe(false);
  });
});

describe("describeDraftAge", () => {
  const now = Date.parse("2026-10-08T12:00:00.000Z");
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it("reads as 'just now' for fresh drafts", () => {
    expect(describeDraftAge(ago(5_000), now)).toBe("just now");
  });

  it("switches to minutes, hours and days", () => {
    expect(describeDraftAge(ago(4 * 60_000), now)).toBe("4 min ago");
    expect(describeDraftAge(ago(3 * 3_600_000), now)).toBe("3 hours ago");
    expect(describeDraftAge(ago(2 * 86_400_000), now)).toBe("2 days ago");
  });

  it("pluralises single units", () => {
    expect(describeDraftAge(ago(1 * 3_600_000), now)).toBe("1 hour ago");
    expect(describeDraftAge(ago(1 * 86_400_000), now)).toBe("1 day ago");
  });

  it("returns empty for missing or invalid input", () => {
    expect(describeDraftAge(null, now)).toBe("");
    expect(describeDraftAge("not-a-date", now)).toBe("");
  });
});

describe("draft size budget", () => {
  it("stays below the localStorage comfort zone", () => {
    expect(MAX_EDITOR_DRAFT_BYTES).toBeLessThanOrEqual(1024 * 1024);
  });
});
