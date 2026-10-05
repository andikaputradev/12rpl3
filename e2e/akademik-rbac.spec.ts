import { expect, type Page, test } from "@playwright/test";

const SISWA_EMAIL = process.env.E2E_SISWA_EMAIL;
const SISWA_PASSWORD = process.env.E2E_SISWA_PASSWORD;
const PENGURUS_EMAIL = process.env.E2E_PENGURUS_EMAIL;
const PENGURUS_PASSWORD = process.env.E2E_PENGURUS_PASSWORD;
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL;
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD;

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata Sandi").fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/**
 * Pengujian negatif wajib Bagian 12 prompt Fase 3: akun pengurus mencoba
 * mengakses /akademik/nilai dan /akademik/absensi harus ditolak. Butuh akun
 * uji BARU role pengurus (E2E_PENGURUS_EMAIL/PASSWORD) - belum ada di
 * environment E2E sebelumnya (Fase 0-2 hanya punya pasangan siswa/staff).
 */
test.describe("Pengurus ditolak dari nilai dan absensi", () => {
  test.skip(
    !PENGURUS_EMAIL || !PENGURUS_PASSWORD,
    "Butuh E2E_PENGURUS_EMAIL/E2E_PENGURUS_PASSWORD - akun uji role pengurus pada environment Supabase nyata.",
  );

  test("role pengurus mendapat 403 di /akademik/nilai", async ({ page }) => {
    await loginAs(page, PENGURUS_EMAIL as string, PENGURUS_PASSWORD as string);
    const response = await page.goto("/akademik/nilai");
    expect(response?.status()).toBe(403);
    await expect(page.getByText("Akses ditolak")).toBeVisible();
  });

  test("role pengurus mendapat 403 di /akademik/absensi", async ({ page }) => {
    await loginAs(page, PENGURUS_EMAIL as string, PENGURUS_PASSWORD as string);
    const response = await page.goto("/akademik/absensi");
    expect(response?.status()).toBe(403);
    await expect(page.getByText("Akses ditolak")).toBeVisible();
  });

  test("role pengurus TETAP bisa mengakses /akademik/tugas dan /akademik/pengumuman", async ({
    page,
  }) => {
    // Kontras penting: pengurus hanya dikecualikan dari nilai/absensi
    // (Bagian 9 brief), bukan dari seluruh modul akademik.
    await loginAs(page, PENGURUS_EMAIL as string, PENGURUS_PASSWORD as string);
    const tugasResponse = await page.goto("/akademik/tugas");
    expect(tugasResponse?.status()).toBe(200);
    const pengumumanResponse = await page.goto("/akademik/pengumuman");
    expect(pengumumanResponse?.status()).toBe(200);
  });
});

test.describe("Siswa dapat mengakses nilai dan absensi miliknya sendiri", () => {
  test.skip(
    !SISWA_EMAIL || !SISWA_PASSWORD,
    "Butuh E2E_SISWA_EMAIL/E2E_SISWA_PASSWORD pada environment Supabase nyata.",
  );

  test("halaman /akademik/nilai dan /akademik/absensi termuat 200 untuk siswa", async ({
    page,
  }) => {
    await loginAs(page, SISWA_EMAIL as string, SISWA_PASSWORD as string);
    const nilaiResponse = await page.goto("/akademik/nilai");
    expect(nilaiResponse?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Nilai" })).toBeVisible();

    const absensiResponse = await page.goto("/akademik/absensi");
    expect(absensiResponse?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Absensi" })).toBeVisible();
  });

  /**
   * "Siswa A tidak bisa melihat nilai siswa B lewat URL manapun" (Bagian 12)
   * - di aplikasi ini TIDAK ADA url dengan parameter studentId sama sekali
   * (identitas selalu dari sesi server, lihat lib/actions/akademik.ts).
   * Test ini membuktikan properti itu secara langsung: menyisipkan parameter
   * query yang lazim dipakai untuk serangan IDOR sama sekali tidak
   * berpengaruh pada apa yang dirender - server tidak pernah membacanya.
   */
  test("parameter query sisipan (percobaan IDOR) tidak berpengaruh pada halaman nilai", async ({
    page,
  }) => {
    await loginAs(page, SISWA_EMAIL as string, SISWA_PASSWORD as string);
    await page.goto("/akademik/nilai");
    const baselineHtml = await page.locator("main, body").first().innerText();

    const tamperedResponse = await page.goto(
      "/akademik/nilai?studentId=00000000-0000-0000-0000-000000000000&userId=00000000-0000-0000-0000-000000000000",
    );
    expect(tamperedResponse?.status()).toBe(200);
    const tamperedHtml = await page.locator("main, body").first().innerText();

    expect(tamperedHtml).toBe(baselineHtml);
  });
});

test.describe("Entry nilai massal wali_kelas tampil benar di sisi siswa", () => {
  test.skip(
    !STAFF_EMAIL || !STAFF_PASSWORD || !SISWA_EMAIL || !SISWA_PASSWORD,
    "Butuh E2E_STAFF_EMAIL/PASSWORD dan E2E_SISWA_EMAIL/PASSWORD pada environment Supabase nyata.",
  );

  test("nilai yang disimpan staf lewat entry massal muncul di /akademik/nilai siswa", async ({
    page,
  }) => {
    await loginAs(page, STAFF_EMAIL as string, STAFF_PASSWORD as string);
    await page.goto("/dashboard/nilai");
    await expect(page.getByRole("heading", { name: "Entry Nilai Massal" })).toBeVisible();

    await page.getByRole("button", { name: "Muat Lembar" }).click();
    const firstScoreInput = page.getByRole("row").nth(1).getByRole("spinbutton");
    await expect(firstScoreInput).toBeVisible({ timeout: 10_000 });

    const uniqueScore = 71; // nilai ganjil khas, kecil kemungkinan sama dengan data lama
    await firstScoreInput.fill(String(uniqueScore));
    await page.getByRole("button", { name: "Simpan Semua" }).click();
    await expect(page.getByText(/tersimpan/)).toBeVisible({ timeout: 10_000 });

    await loginAs(page, SISWA_EMAIL as string, SISWA_PASSWORD as string);
    await page.goto("/akademik/nilai");
    await expect(page.getByText(String(uniqueScore)).first()).toBeVisible({ timeout: 10_000 });
  });
});
