import { describe, expect, it } from "vitest";
import { resolveAnonymousContentStatus } from "./moderation";

describe("resolveAnonymousContentStatus", () => {
  it("mengembalikan approved untuk konten non-anonim", () => {
    expect(resolveAnonymousContentStatus(false)).toBe("approved");
  });

  it("mengembalikan pending_review untuk konten anonim", () => {
    expect(resolveAnonymousContentStatus(true)).toBe("pending_review");
  });
});
