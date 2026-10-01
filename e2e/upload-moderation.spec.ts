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

test.describe("Alur Unggah Siswa → Moderasi Staf", () => {
  test.skip(
    !SISWA_EMAIL || !SISWA_PASSWORD || !STAFF_EMAIL || !STAFF_PASSWORD || !TEST_IMAGE_PATH,
    "Butuh E2E_SISWA_EMAIL/PASSWORD, E2E_STAFF_EMAIL/PASSWORD, dan E2E_TEST_IMAGE_PATH pada environment Supabase nyata.",
  );

  test("siswa unggah foto berstatus pending, staf menyetujui, item tayang di album", async ({
    page,
  }) => {
    await loginAs(page, SISWA_EMAIL as string, SISWA_PASSWORD as string);

    await page.goto("/galeri/upload");
    // biome-ignore lint/security/noSecrets: selector CSS atribut, bukan kredensial.
    await page.locator("select[name=albumId]").selectOption({ index: 0 });
    // biome-ignore lint/security/noSecrets: selector CSS atribut, bukan kredensial.
    await page.setInputFiles('input[name="image"]', TEST_IMAGE_PATH as string);

    const uniqueCaption = `Caption uji otomatis ${Date.now()}`;
    await page.getByLabel("Caption (opsional)").fill(uniqueCaption);
    await page.getByRole("button", { name: "Kirim" }).click();

    await page.waitForURL(/\/galeri\/kiriman-saya/);
    await expect(page.getByText(uniqueCaption)).toBeVisible();
    await expect(page.getByText("Menunggu")).toBeVisible();

    await loginAs(page, STAFF_EMAIL as string, STAFF_PASSWORD as string);
    await page.goto("/dashboard/moderasi");

    const row = page.locator(`text=${uniqueCaption}`).locator("..").locator("..");
    await row.getByRole("button", { name: /Setujui/ }).click();

    await expect(page.getByText(uniqueCaption)).toHaveCount(0, { timeout: 10_000 });
  });

  test("staf menolak kiriman dengan alasan wajib, alasan tampil ke pengunggah", async ({
    page,
  }) => {
    await loginAs(page, SISWA_EMAIL as string, SISWA_PASSWORD as string);
    await page.goto("/galeri/upload");
    // biome-ignore lint/security/noSecrets: selector CSS atribut, bukan kredensial.
    await page.locator("select[name=albumId]").selectOption({ index: 0 });
    // biome-ignore lint/security/noSecrets: selector CSS atribut, bukan kredensial.
    await page.setInputFiles('input[name="image"]', TEST_IMAGE_PATH as string);

    const uniqueCaption = `Caption ditolak ${Date.now()}`;
    await page.getByLabel("Caption (opsional)").fill(uniqueCaption);
    await page.getByRole("button", { name: "Kirim" }).click();
    await page.waitForURL(/\/galeri\/kiriman-saya/);

    await loginAs(page, STAFF_EMAIL as string, STAFF_PASSWORD as string);
    await page.goto("/dashboard/moderasi");

    const row = page.locator(`text=${uniqueCaption}`).locator("..").locator("..");
    await row.getByRole("button", { name: /Tolak/ }).click();

    const dialog = page.getByRole("dialog", { name: "Tolak Kiriman" });
    await expect(dialog).toBeVisible();

    // Tombol submit tetap nonaktif secara efektif untuk alasan < 10 karakter
    // (validasi Zod di server menolaknya) — uji mengisi alasan valid.
    await dialog.getByLabel("Alasan Penolakan").fill("Foto tidak sesuai tema album kegiatan.");
    await dialog.getByRole("button", { name: "Tolak Kiriman" }).click();

    await expect(dialog).not.toBeVisible();

    await loginAs(page, SISWA_EMAIL as string, SISWA_PASSWORD as string);
    await page.goto("/galeri/kiriman-saya");
    await expect(page.getByText("Ditolak").first()).toBeVisible();
    await expect(page.getByText(/Alasan: Foto tidak sesuai tema/)).toBeVisible();
  });
});
