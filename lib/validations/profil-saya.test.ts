import { describe, expect, it } from "vitest";
import { updateMyProfileSchema } from "./profil-saya";

// biome-ignore lint/security/noSecrets: nama describe test
describe("updateMyProfileSchema", () => {
  it("menerima data profil lengkap yang valid", () => {
    const result = updateMyProfileSchema.safeParse({
      fullName: "Rikiyanto",
      bio: "Siswa RPL yang gemar backend development dan open source.",
      citaCita: "Cloud Architect",
      yearbookQuote: "Jangan berhenti belajar!",
      instagram: "@rikiyanto",
      tiktok: "@riki_dev",
      github: "rikiyanto",
      linkedin: "rikiyanto",
      website: "https://rikiyanto.dev",
      publicContact: "08123456789",
      syncYearbook: "true",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe("Rikiyanto");
      expect(result.data.syncYearbook).toBe(true);
    }
  });

  it("menerima form parsial/kosong tanpa error", () => {
    const result = updateMyProfileSchema.safeParse({
      fullName: "",
      bio: "",
      citaCita: "",
      yearbookQuote: "",
      instagram: "",
      tiktok: "",
      github: "",
      linkedin: "",
      website: "",
      publicContact: "",
    });

    expect(result.success).toBe(true);
  });

  it("menolak nama jika kurang dari 2 karakter ketika diisi", () => {
    const result = updateMyProfileSchema.safeParse({
      fullName: "A",
    });

    expect(result.success).toBe(false);
  });

  it("menolak bio jika melebihi batas 500 karakter", () => {
    const result = updateMyProfileSchema.safeParse({
      bio: "x".repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it("menolak kutipan yearbook jika melebihi batas 280 karakter", () => {
    const result = updateMyProfileSchema.safeParse({
      yearbookQuote: "y".repeat(281),
    });

    expect(result.success).toBe(false);
  });

  it("menangani konversi syncYearbook dari boolean atau string 'on' / 'true'", () => {
    const resOn = updateMyProfileSchema.safeParse({ syncYearbook: "on" });
    expect(resOn.success).toBe(true);
    if (resOn.success) {
      expect(resOn.data.syncYearbook).toBe(true);
    }

    const resFalse = updateMyProfileSchema.safeParse({ syncYearbook: false });
    expect(resFalse.success).toBe(true);
    if (resFalse.success) {
      expect(resFalse.data.syncYearbook).toBe(false);
    }
  });
});
