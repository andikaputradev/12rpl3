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
}

test.describe("RBAC Dashboard Admin", () => {
  test.skip(
    !SISWA_EMAIL || !SISWA_PASSWORD,
    "Butuh E2E_SISWA_EMAIL/E2E_SISWA_PASSWORD - akun uji role siswa pada environment Supabase nyata.",
  );

  test("role siswa mendapat 403 saat mengakses dashboard admin", async ({ page }) => {
    await loginAs(page, SISWA_EMAIL as string, SISWA_PASSWORD as string);
    await page.waitForURL((url) => !url.pathname.startsWith("/login"));

    const response = await page.goto("/dashboard/profil");
    expect(response?.status()).toBe(403);
    await expect(page.getByText("Akses ditolak")).toBeVisible();
  });
});

test.describe("Form Admin Profil Kelas", () => {
  test.skip(
    !STAFF_EMAIL || !STAFF_PASSWORD,
    "Butuh E2E_STAFF_EMAIL/E2E_STAFF_PASSWORD - akun uji role wali_kelas/super_admin pada environment Supabase nyata.",
  );

  test("submit profil kelas berhasil dan menampilkan toast konfirmasi", async ({ page }) => {
    await loginAs(page, STAFF_EMAIL as string, STAFF_PASSWORD as string);
    await page.waitForURL((url) => !url.pathname.startsWith("/login"));

    await page.goto("/dashboard/profil");
    await expect(page.getByRole("heading", { name: "Kelola Profil Kelas" })).toBeVisible();

    const uniqueMotto = `Motto uji otomatis ${Date.now()}`;
    await page.getByLabel("Motto").fill(uniqueMotto);
    await page.getByRole("button", { name: "Simpan Profil Kelas" }).click();

    await expect(page.getByText("Profil kelas tersimpan.")).toBeVisible({ timeout: 10_000 });
  });
});
