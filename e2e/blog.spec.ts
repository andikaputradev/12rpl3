import { expect, type Page, test } from "@playwright/test";

const SISWA_EMAIL = process.env.E2E_SISWA_EMAIL;
const SISWA_PASSWORD = process.env.E2E_SISWA_PASSWORD;
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL;
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD;

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata Sandi").fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.describe("Alur tulis artikel siswa sampai disetujui dan tampil publik", () => {
  test.skip(
    !SISWA_EMAIL || !SISWA_PASSWORD || !STAFF_EMAIL || !STAFF_PASSWORD,
    "Butuh E2E_SISWA_EMAIL/PASSWORD dan E2E_STAFF_EMAIL/PASSWORD pada environment Supabase nyata.",
  );

  test("tulis draf -> kirim tinjau -> staf terbitkan -> tampil di /blog", async ({ page }) => {
    const uniqueTitle = `Artikel Uji E2E ${Date.now()}`;

    await loginAs(page, SISWA_EMAIL as string, SISWA_PASSWORD as string);
    await page.goto("/blog/tulis");
    await page.getByLabel("Judul").fill(uniqueTitle);
    await page
      .getByLabel(/Isi Artikel/)
      .fill("# Halo\n\nIni isi artikel uji otomatis untuk memverifikasi alur blog end-to-end.");
    await page.getByRole("button", { name: "Simpan Draf" }).click();
    await page.waitForURL("**/blog/tulisan-saya");

    await page
      .locator("li", { hasText: uniqueTitle })
      .getByRole("button", { name: "Kirim untuk Ditinjau" })
      .click();
    await expect(page.getByText(/dikirim untuk ditinjau/i)).toBeVisible({ timeout: 10_000 });

    await loginAs(page, STAFF_EMAIL as string, STAFF_PASSWORD as string);
    await page.goto("/dashboard/blog");
    const queueItem = page.getByText(uniqueTitle);
    await expect(queueItem).toBeVisible({ timeout: 10_000 });
    await page
      .locator("div", { hasText: uniqueTitle })
      .getByRole("button", { name: /Terbitkan artikel/ })
      .first()
      .click();
    await expect(queueItem).toBeHidden({ timeout: 10_000 });

    await page.goto("/blog");
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10_000 });
  });

  test("staf pengujian: siswa TIDAK bisa memaksa status published lewat tombol yang sama", async ({
    page,
  }) => {
    // Kontrol negatif UI: tombol siswa SELALU berlabel "Kirim untuk
    // Ditinjau", tidak pernah "Publikasikan" - label ditentukan dari role
    // sesi yang dibaca page.tsx di server, bukan dapat dipilih dari client.
    await loginAs(page, SISWA_EMAIL as string, SISWA_PASSWORD as string);
    await page.goto("/blog/tulisan-saya");
    await expect(page.getByRole("button", { name: "Publikasikan" })).toHaveCount(0);
  });
});

test.describe("Komentar: hapus milik sendiri dan sembunyikan oleh staf", () => {
  test.skip(
    !SISWA_EMAIL || !SISWA_PASSWORD || !STAFF_EMAIL || !STAFF_PASSWORD,
    "Butuh dua pasang kredensial uji dan minimal satu artikel published pada environment Supabase nyata.",
  );

  test("siswa dapat menghapus komentar miliknya sendiri", async ({ page }) => {
    await loginAs(page, SISWA_EMAIL as string, SISWA_PASSWORD as string);
    await page.goto("/blog");
    await page.locator("a[href^='/blog/']").first().click();
    await page.getByPlaceholder("Tulis komentar...").fill(`Komentar uji E2E ${Date.now()}`);
    await page.getByRole("button", { name: "Kirim Komentar" }).click();
    await expect(page.getByText(/Komentar ditambahkan/)).toBeVisible({ timeout: 10_000 });

    const ownDeleteButton = page.getByRole("button", { name: "Hapus" }).first();
    await ownDeleteButton.click();
    await expect(page.getByText(/Komentar dihapus/)).toBeVisible({ timeout: 10_000 });
  });
});
