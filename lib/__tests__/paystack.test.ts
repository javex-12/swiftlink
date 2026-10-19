import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { initializePlanCheckout } from "../paystack";

describe("Paystack initialize checkout", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.PAYSTACK_SECRET_KEY = "sk_test_12345";
    process.env.PAYSTACK_PLAN_PRO = "PLN_pro_123";
    process.env.PAYSTACK_PLAN_BUSINESS = "PLN_biz_123";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("correctly maps snake_case authorization_url from Paystack into camelCase authorizationUrl", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: true,
        message: "Authorization URL created",
        data: {
          authorization_url: "https://checkout.paystack.com/access_code_123",
          access_code: "access_code_123",
          reference: "ref_123",
        },
      }),
    } as any);

    const result = await initializePlanCheckout({
      email: "merchant@example.com",
      plan: "pro",
      ownerId: "owner_123",
      callbackUrl: "https://example.com/account?billing=return",
    });

    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.data?.authorizationUrl).toBe("https://checkout.paystack.com/access_code_123");
    expect(result.data?.accessCode).toBe("access_code_123");
    expect(result.data?.reference).toBe("ref_123");
  });

  it("handles failure when Paystack returns an error message", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        status: false,
        message: "Invalid key or currency",
      }),
    } as any);

    const result = await initializePlanCheckout({
      email: "merchant@example.com",
      plan: "pro",
      ownerId: "owner_123",
      callbackUrl: "https://example.com/account?billing=return",
    });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.message).toBe("Invalid key or currency");
  });
});
