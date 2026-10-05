import { describe, expect, it } from "vitest";
import { scrubPii, scrubSentryEvent } from "./pii-scrubber";

describe("scrubPii", () => {
  it("redacts sensitive fields like grades, attendance, and message", () => {
    const input = {
      grades: [95, 88, 92],
      attendance: { sakit: 1, izin: 0, alpa: 0 },
      message: "Ini pesan pribadi rahasia",
      nis: "12345",
      safeInfo: "public content",
    };

    const output = scrubPii(input);
    expect(output.grades).toBe("[REDACTED_PII]");
    expect(output.attendance).toBe("[REDACTED_PII]");
    expect(output.message).toBe("[REDACTED_PII]");
    expect(output.nis).toBe("[REDACTED_PII]");
    expect(output.safeInfo).toBe("public content");
  });

  it("redacts bearer tokens and jwt strings", () => {
    const input = {
      header: "Bearer secret-token-12345",
      // biome-ignore lint/security/noSecrets: dummy test token
      jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSignature1234567890",
    };

    const output = scrubPii(input);
    expect(output.header).toContain("[REDACTED_TOKEN]");
    expect(output.jwt).toBe("[REDACTED_JWT]");
  });

  it("scrubs headers and cookies in Sentry event", () => {
    const event = {
      request: {
        headers: {
          authorization: "Bearer secret-token",
          cookie: "sb-access-token=xyz",
          "user-agent": "Mozilla/5.0",
        },
        cookies: "some-cookie",
        data: {
          nilai: 100,
          catatan: "Catatan guru",
        },
      },
      extra: {
        pesan: "Pesan siswa",
      },
    };

    const scrubbed = scrubSentryEvent(event);
    expect(scrubbed.request?.headers?.authorization).toBeUndefined();
    expect(scrubbed.request?.headers?.cookie).toBeUndefined();
    expect(scrubbed.request?.headers?.["user-agent"]).toBe("Mozilla/5.0");
    expect(scrubbed.request?.cookies).toBe("[REDACTED_COOKIES]");
    const reqData = scrubbed.request?.data as Record<string, unknown> | undefined;
    expect(reqData?.nilai).toBe("[REDACTED_PII]");
    const extraData = scrubbed.extra as Record<string, unknown> | undefined;
    expect(extraData?.pesan).toBe("[REDACTED_PII]");
  });
});
