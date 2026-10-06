import { describe, expect, it } from "vitest";
import { changePasswordSchema, loginSchema } from "./auth";

describe("loginSchema", () => {
  it("menerima kredensial valid", () => {
    const result = loginSchema.safeParse({
      email: "siswa@example.com",
      password: "sandiaman123",
    });
    expect(result.success).toBe(true);
  });

  it("menormalkan email ke huruf kecil dan memangkas spasi", () => {
    const result = loginSchema.safeParse({
      email: "  Siswa@Example.com  ",
      password: "sandiaman123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("siswa@example.com");
    }
  });

  it("menolak format email tidak valid", () => {
    const result = loginSchema.safeParse({ email: "bukan-email", password: "sandiaman123" });
    expect(result.success).toBe(false);
  });

  it("menolak kata sandi kurang dari 8 karakter", () => {
    const result = loginSchema.safeParse({ email: "siswa@example.com", password: "pendek" });
    expect(result.success).toBe(false);
  });

  it("menolak redirectTo yang bukan path relatif (mencegah open redirect)", () => {
    const result = loginSchema.safeParse({
      email: "siswa@example.com",
      password: "sandiaman123",
      redirectTo: "https://evil.example.com/phish",
    });
    expect(result.success).toBe(false);
  });

  it("menerima redirectTo berupa path relatif", () => {
    const result = loginSchema.safeParse({
      email: "siswa@example.com",
      password: "sandiaman123",
      redirectTo: "/akademik/nilai",
    });
    expect(result.success).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  it("menerima password baru dan konfirmasi yang cocok dan minimal 8 karakter", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "passwordbaru123",
      confirmPassword: "passwordbaru123",
    });
    expect(result.success).toBe(true);
  });

  it("menolak password baru yang kurang dari 8 karakter", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "pendek",
      confirmPassword: "pendek",
    });
    expect(result.success).toBe(false);
  });

  it("menolak konfirmasi password yang tidak cocok", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "passwordbaru123",
      confirmPassword: "passwordberbeda123",
    });
    expect(result.success).toBe(false);
  });
});
