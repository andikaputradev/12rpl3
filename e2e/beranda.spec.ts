import { expect, test } from "@playwright/test";

test.describe("Beranda", () => {
  test("menampilkan heading utama dan eyebrow identitas kelas", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/XII RPL 3/i).first()).toBeVisible();
  });

  test("navigasi ke halaman login berfungsi", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Masuk" }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Masuk ke Portal" })).toBeVisible();
  });

  test("toggle tema mengganti kelas dark pada elemen html", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const initialHasDark = await html.evaluate((el) => el.classList.contains("dark"));

    await page.getByRole("button", { name: /Aktifkan mode/ }).click();
    await expect
      .poll(async () => html.evaluate((el) => el.classList.contains("dark")))
      .toBe(!initialHasDark);
  });

  test("statistik dan bagian sorotan kegiatan tampil (terisi atau empty state)", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("Statistik Kelas")).toBeVisible();
    await expect(page.getByText("Sorotan Kegiatan")).toBeVisible();
  });
});

test.describe("Profil Kelas", () => {
  test("halaman render lengkap dengan struktur organisasi", async ({ page }) => {
    await page.goto("/profil");

    await expect(page.getByRole("heading", { name: /Profil Kelas/i })).toBeVisible();
    await expect(page.getByText("Struktur Organisasi")).toBeVisible();
  });
});
