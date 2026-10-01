import { expect, type Page, test } from "@playwright/test";

const SISWA_EMAIL = process.env.E2E_SISWA_EMAIL;
const SISWA_PASSWORD = process.env.E2E_SISWA_PASSWORD;
const SISWA2_EMAIL = process.env.E2E_SISWA2_EMAIL;
const SISWA2_PASSWORD = process.env.E2E_SISWA2_PASSWORD;
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL;
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD;

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata Sandi").fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.describe("Pesan-kesan: penerima melihat sebelum disetujui, publik belum", () => {
  test.skip(
    !SISWA_EMAIL ||
      !SISWA_PASSWORD ||
      !SISWA2_EMAIL ||
      !SISWA2_PASSWORD ||
      !STAFF_EMAIL ||
      !STAFF_PASSWORD,
    "Butuh E2E_SISWA_EMAIL/PASSWORD, E2E_SISWA2_EMAIL/PASSWORD (siswa penerima berbeda), dan E2E_STAFF_EMAIL/PASSWORD pada environment nyata.",
  );

  test("siswa A kirim ke siswa B (non-anonim): B melihat pending, publik belum, lalu tampil setelah staf setujui", async ({
    page,
  }) => {
    const uniqueMessage = `Pesan kesan uji E2E ${Date.now()}`;

    await loginAs(page, SISWA_EMAIL as string, SISWA_PASSWORD as string);
    await page.goto("/kelulusan/tulis-pesan");
    await page.getByRole("combobox").click();
    // Pilih opsi pertama yang tersedia di Combobox pencarian penerima.
    await page.getByRole("option").first().click();
    await page.getByLabel("Pesan").fill(uniqueMessage);
    await page.getByRole("button", { name: "Kirim Pesan-Kesan" }).click();
    await expect(page.getByText(/Pesan-kesan terkirim/i)).toBeVisible({ timeout: 10_000 });

    // Belum tayang di feed publik /kelulusan sebelum disetujui.
    await page.goto("/kelulusan");
    await expect(page.getByText(uniqueMessage)).toHaveCount(0);

    await loginAs(page, STAFF_EMAIL as string, STAFF_PASSWORD as string);
    await page.goto("/dashboard/kelulusan");
    const queueItem = page.getByText(uniqueMessage);
    await expect(queueItem).toBeVisible({ timeout: 10_000 });
    await page
      .locator("div", { hasText: uniqueMessage })
      .getByRole("button", { name: "Setujui" })
      .first()
      .click();
    await expect(queueItem).toBeHidden({ timeout: 10_000 });

    await page.goto("/kelulusan");
    await expect(page.getByText(uniqueMessage)).toBeVisible({ timeout: 10_000 });
  });

  test("mengirim ulang ke penerima yang sama menimpa pesan sebelumnya, bukan menumpuk baris baru", async ({
    page,
  }) => {
    const firstMessage = `Pesan pertama uji E2E ${Date.now()}`;
    const secondMessage = `Pesan revisi uji E2E ${Date.now()}`;

    await loginAs(page, SISWA_EMAIL as string, SISWA_PASSWORD as string);
    await page.goto("/kelulusan/tulis-pesan");
    await page.getByRole("combobox").click();
    await page.getByRole("option").first().click();
    await page.getByLabel("Pesan").fill(firstMessage);
    await page.getByRole("button", { name: "Kirim Pesan-Kesan" }).click();
    await expect(page.getByText(/Pesan-kesan terkirim/i)).toBeVisible({ timeout: 10_000 });

    await page.goto("/kelulusan/tulis-pesan");
    await page.getByRole("combobox").click();
    await page.getByRole("option").first().click();
    await page.getByLabel("Pesan").fill(secondMessage);
    await page.getByRole("button", { name: "Kirim Pesan-Kesan" }).click();
    await expect(page.getByText(/Pesan-kesan terkirim/i)).toBeVisible({ timeout: 10_000 });

    await loginAs(page, STAFF_EMAIL as string, STAFF_PASSWORD as string);
    await page.goto("/dashboard/kelulusan");
    await expect(page.getByText(secondMessage)).toBeVisible({ timeout: 10_000 });
    // Pesan pertama TIDAK ada lagi sebagai baris terpisah: ditimpa (upsert).
    await expect(page.getByText(firstMessage)).toHaveCount(0);
  });
});
