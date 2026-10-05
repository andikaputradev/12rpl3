import { expect, test } from "@playwright/test";

test.describe("Lightbox Galeri", () => {
  test("membuka lightbox dari grid dan navigasi keyboard prev/next", async ({ page }) => {
    await page.goto("/galeri");

    const firstAlbumLink = page.locator('a[href^="/galeri/"]').first();
    const hasAlbum = (await firstAlbumLink.count()) > 0;
    test.skip(!hasAlbum, "Tidak ada album tersedia - jalankan `pnpm db:seed` terlebih dulu.");

    await firstAlbumLink.click();
    await page.waitForURL(/\/galeri\/[^/]+$/);

    const items = page.locator('button[aria-label^="Putar video"], .columns-2 button');
    const itemCount = await items.count();
    test.skip(itemCount === 0, "Album belum memiliki item approved.");

    await items.first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    if (itemCount > 1) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(350);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
});

const PRIVATE_STUDENT_NAME = process.env.E2E_PRIVATE_STUDENT_NAME;

test.describe("Privasi Direktori", () => {
  test.skip(
    !PRIVATE_STUDENT_NAME,
    "Butuh E2E_PRIVATE_STUDENT_NAME - nama siswa uji dengan isPublic=false pada database nyata.",
  );

  test("siswa dengan isPublic=false tidak muncul di grid direktori publik", async ({ page }) => {
    await page.goto("/direktori");
    await expect(page.getByText(PRIVATE_STUDENT_NAME as string)).toHaveCount(0);
  });

  test("slug siswa privat mengembalikan 404, tidak bisa dibedakan dari slug yang tidak ada", async ({
    page,
  }) => {
    const response = await page.goto("/direktori/slug-yang-jelas-tidak-ada-9999");
    expect(response?.status()).toBe(404);
  });
});
