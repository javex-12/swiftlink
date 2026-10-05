import { describe, expect, it } from "vitest";
import { checkLocalStorageMigrationNeeded } from "../migration-sync";

describe("LocalStorage to Database Safe Migration", () => {
  it("does not migrate when userId is missing", () => {
    const res = checkLocalStorageMigrationNeeded("");
    expect(res.canMigrate).toBe(false);
  });

  it("does not migrate when DB store already has products", () => {
    const fakeDbState: any = {
      products: [{ id: 1, name: "Sample Shoes", price: 15000 }],
    };
    const res = checkLocalStorageMigrationNeeded("user-123", fakeDbState);
    expect(res.canMigrate).toBe(false);
  });
});
