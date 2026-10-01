import path from "node:path";
import { expect, type Page, test } from "@playwright/test";

const SISWA_EMAIL = process.env.E2E_SISWA_EMAIL;
const SISWA_PASSWORD = process.env.E2E_SISWA_PASSWORD;
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL;
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD;
const TEST_IMAGE_PATH = process.env.E2E_TEST_IMAGE_PATH;

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata Sandi").fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.describe("Alur submit portofolio sampai tampil publik", () => {
  test.skip(
    !SISWA_EMAIL || !SISWA_PASSWORD || !STAFF_EMAIL || !STAFF_PASSWORD,
    "Butuh E2E_SISWA_EMAIL/PASSWORD dan E2E_STAFF_EMAIL/PASSWORD pada environment Supabase nyata.",
  );

  test("submit siswa -> antrean staf -> setujui -> tampil di /prestasi", async ({ page }) => {
    const uniqueTitle = `Proyek Uji E2E ${Date.now()}`;

    await loginAs(page, SISWA_EMAIL as string, SISWA_PASSWORD as string);
    await page.goto("/portofolio/submit");
    await page.getByLabel("Judul Proyek").fill(uniqueTitle);
    await page
      .getByLabel("Deskripsi")
      .fill(
        "Deskripsi proyek uji otomatis untuk memverifikasi alur moderasi portofolio end-to-end.",
      );
    await page.getByLabel(/Tech Stack/).fill("Next.js, TypeScript");
    if (TEST_IMAGE_PATH) {
      await page.getByLabel(/Thumbnail/).setInputFiles(path.resolve(TEST_IMAGE_PATH));
    }
    await page.getByRole("button", { name: "Kirim untuk Ditinjau" }).click();
    await expect(page.getByText(/terkirim untuk ditinjau/i)).toBeVisible({ timeout: 10_000 });

    await loginAs(page, STAFF_EMAIL as string, STAFF_PASSWORD as string);
    await page.goto("/dashboard/portofolio");
    const queueItem = page.getByText(uniqueTitle);
    await expect(queueItem).toBeVisible({ timeout: 10_000 });
    await page
      .locator("div", { hasText: uniqueTitle })
      .getByRole("button", { name: /Setujui proyek/ })
      .first()
      .click();
    await expect(queueItem).toBeHidden({ timeout: 10_000 });

    await page.goto("/prestasi");
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10_000 });
  });
});
