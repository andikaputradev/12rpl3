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

test.describe("Buku tamu: kirim tanpa login", () => {
  // Turnstile mendeteksi browser otomatis sebagai bot secara sengaja, karena
  // itu environment yang menjalankan spec ini WAJIB mengatur
  // NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA dan
  // TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA (dummy "always
  // passes" resmi Cloudflare, https://developers.cloudflare.com/turnstile/
  // reference/testing/, diperiksa 26 September 2026): bukan kredensial
  // Turnstile produksi, yang akan selalu gagal untuk trafik headless.
  test.skip(
    !STAFF_EMAIL || !STAFF_PASSWORD,
    "Butuh E2E_STAFF_EMAIL/PASSWORD dan dummy Turnstile keys pada environment nyata.",
  );

  test("pengunjung anonim mengirim pesan, honeypot kosong, staf menyetujui, tampil di dinding publik", async ({
    page,
  }) => {
    const uniqueMessage = `Pesan uji E2E ${Date.now()}`;

    await page.goto("/interaksi/buku-tamu");
    await page.getByLabel("Nama").fill("Pengunjung Uji E2E");
    await page.getByLabel("Pesan").fill(uniqueMessage);
    // Field honeypot ("Website") sengaja TIDAK diisi: kontrol positif jalur normal.
    await page.getByRole("button", { name: "Kirim Pesan" }).click();
    await expect(page.getByText(/akan tampil setelah ditinjau/i)).toBeVisible({
      timeout: 10_000,
    });

    await loginAs(page, STAFF_EMAIL as string, STAFF_PASSWORD as string);
    await page.goto("/dashboard/interaksi");
    const queueItem = page.getByText(uniqueMessage);
    await expect(queueItem).toBeVisible({ timeout: 10_000 });
    await page
      .locator("div", { hasText: uniqueMessage })
      .getByRole("button", { name: "Setujui" })
      .first()
      .click();
    await expect(queueItem).toBeHidden({ timeout: 10_000 });

    await page.goto("/interaksi/buku-tamu");
    await expect(page.getByText(uniqueMessage)).toBeVisible({ timeout: 10_000 });
  });

  test("honeypot terisi menolak diam-diam: tampak berhasil, tidak pernah masuk antrean moderasi", async ({
    page,
  }) => {
    const uniqueMessage = `Pesan bot uji E2E ${Date.now()}`;

    await page.goto("/interaksi/buku-tamu");
    await page.getByLabel("Nama").fill("Skrip Otomatis");
    await page.getByLabel("Pesan").fill(uniqueMessage);
    // Mengisi honeypot secara paksa lewat DOM (mensimulasikan skrip generik
    // yang mengisi SEMUA field tanpa memeriksa maksud semantiknya).
    // biome-ignore lint/security/noSecrets: selector CSS biasa, bukan kredensial sungguhan.
    await page.locator('input[name="website"]').fill("http://spam.example.com");
    await page.getByRole("button", { name: "Kirim Pesan" }).click();
    // Respons ke pengirim tetap tampak berhasil (Bagian 9 prompt).
    await expect(page.getByText(/akan tampil setelah ditinjau/i)).toBeVisible({
      timeout: 10_000,
    });

    await loginAs(page, STAFF_EMAIL as string, STAFF_PASSWORD as string);
    await page.goto("/dashboard/interaksi");
    // TIDAK PERNAH muncul di antrean moderasi karena tidak pernah tersimpan.
    await expect(page.getByText(uniqueMessage)).toHaveCount(0);
  });
});

test.describe("Aspirasi: status awal berbeda untuk anonim vs non-anonim", () => {
  test.skip(
    !SISWA_EMAIL || !SISWA_PASSWORD,
    "Butuh E2E_SISWA_EMAIL/PASSWORD pada environment Supabase nyata.",
  );

  test("aspirasi non-anonim langsung tampil tanpa menunggu moderasi", async ({ page }) => {
    const uniqueContent = `Aspirasi terbuka uji E2E ${Date.now()}`;

    await loginAs(page, SISWA_EMAIL as string, SISWA_PASSWORD as string);
    await page.goto("/interaksi/aspirasi");
    await page.getByLabel("Aspirasi").fill(uniqueContent);
    // Switch anonim TIDAK diaktifkan: kontrol positif jalur terbuka.
    await page.getByRole("button", { name: "Kirim Aspirasi" }).click();
    await expect(page.getByText(/langsung tampil di papan/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(uniqueContent)).toBeVisible({ timeout: 10_000 });
  });

  test("aspirasi anonim TIDAK langsung tampil, menunggu tinjauan staf", async ({ page }) => {
    const uniqueContent = `Aspirasi anonim uji E2E ${Date.now()}`;

    await loginAs(page, SISWA_EMAIL as string, SISWA_PASSWORD as string);
    await page.goto("/interaksi/aspirasi");
    await page.getByLabel("Aspirasi").fill(uniqueContent);
    await page.getByLabel("Kirim sebagai anonim").click();
    await page.getByRole("button", { name: "Kirim Aspirasi" }).click();
    await expect(page.getByText(/tampil setelah ditinjau/i)).toBeVisible({ timeout: 10_000 });
    // Belum tayang di papan publik sampai staf menyetujui.
    await expect(page.getByText(uniqueContent)).toHaveCount(0);
  });
});

test.describe("Polling: satu suara per pemilih", () => {
  test.skip(
    !SISWA_EMAIL || !SISWA_PASSWORD || !STAFF_EMAIL || !STAFF_PASSWORD,
    "Butuh dua pasang kredensial uji dan minimal satu polling aktif pada environment nyata.",
  );

  test("setelah memilih, form diganti hasil dan tidak bisa memilih ulang", async ({ page }) => {
    await loginAs(page, SISWA_EMAIL as string, SISWA_PASSWORD as string);
    await page.goto("/interaksi/polling");

    const firstPoll = page.locator("div").filter({ hasText: "Kirim Suara" }).first();
    await firstPoll.getByRole("radio").first().click();
    await firstPoll.getByRole("button", { name: "Kirim Suara" }).click();
    await expect(page.getByText(/Suara tersimpan/i)).toBeVisible({ timeout: 10_000 });

    // Muat ulang: server (bukan state client) yang menegakkan larangan vote
    // ganda, jadi diverifikasi lewat navigasi penuh, bukan hanya state React.
    await page.reload();
    await expect(page.getByRole("button", { name: "Kirim Suara" }).first()).toHaveCount(0);
  });
});
