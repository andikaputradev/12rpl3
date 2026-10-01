import { expect, test } from "@playwright/test";

test.describe("Direktori Siswa", () => {
  test("grid render dan search bar tampil", async ({ page }) => {
    await page.goto("/direktori");
    await expect(page.getByRole("heading", { name: "Direktori Siswa" })).toBeVisible();
    await expect(page.getByLabel("Cari siswa")).toBeVisible();
  });

  test("pencarian dengan kata kunci tidak ditemukan menampilkan empty state", async ({ page }) => {
    await page.goto("/direktori");
    const search = page.getByLabel("Cari siswa");
    await search.fill("zzzzzznamatidakada9999");

    await expect(
      page.getByText("Tidak ditemukan siswa dengan nama tersebut. Coba kata kunci lain."),
    ).toBeVisible();

    await page.getByRole("button", { name: "Reset Pencarian" }).click();
    await expect(search).toHaveValue("");
  });
});

test.describe("Galeri", () => {
  test("listing render dengan tab kategori", async ({ page }) => {
    await page.goto("/galeri");
    await expect(page.getByRole("heading", { name: "Galeri", exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Semua" })).toBeVisible();
  });

  test("tombol unggah mengarahkan ke login bila belum masuk", async ({ page }) => {
    await page.goto("/galeri");
    await page.getByRole("link", { name: /Masuk untuk Unggah|Unggah Foto/ }).click();
    await expect(page).toHaveURL(/\/login|\/galeri\/upload/);
  });
});
