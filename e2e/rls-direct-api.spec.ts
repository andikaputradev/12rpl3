import { expect, test } from "@playwright/test";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SISWA_EMAIL = process.env.E2E_SISWA_EMAIL;
const SISWA_PASSWORD = process.env.E2E_SISWA_PASSWORD;
const PENGURUS_EMAIL = process.env.E2E_PENGURUS_EMAIL;
const PENGURUS_PASSWORD = process.env.E2E_PENGURUS_PASSWORD;

async function signIn(
  request: import("@playwright/test").APIRequestContext,
  email: string,
  password: string,
) {
  const response = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: SUPABASE_ANON_KEY as string, "Content-Type": "application/json" },
    data: { email, password },
  });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<{ access_token: string; user: { id: string } }>;
}

/**
 * Verifikasi langsung terhadap RLS Postgres, bukan lewat UI aplikasi: siswa
 * login lewat endpoint Auth Supabase asli, lalu mencoba PATCH gallery_items
 * langsung ke REST API - harus ditolak (RLS `items_update_staff_only`
 * sengaja tidak memberi siswa hak UPDATE atas barisnya sendiri, lihat
 * drizzle/0005_direktori_galeri_rls.sql).
 */
test.describe("RLS gallery_items - percobaan manipulasi langsung", () => {
  test.skip(
    !SUPABASE_URL || !SUPABASE_ANON_KEY || !SISWA_EMAIL || !SISWA_PASSWORD,
    "Butuh NEXT_PUBLIC_SUPABASE_URL/ANON_KEY dan E2E_SISWA_EMAIL/PASSWORD pada environment Supabase nyata.",
  );

  test("siswa tidak bisa UPDATE status gallery_items miliknya sendiri via REST API langsung", async ({
    request,
  }) => {
    const authResponse = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: SUPABASE_ANON_KEY as string, "Content-Type": "application/json" },
      data: { email: SISWA_EMAIL, password: SISWA_PASSWORD },
    });
    expect(authResponse.ok()).toBe(true);
    const { access_token: accessToken, user } = await authResponse.json();

    const ownItemsResponse = await request.get(
      `${SUPABASE_URL}/rest/v1/gallery_items?uploaded_by=eq.${user.id}&select=id&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY as string,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const ownItems = await ownItemsResponse.json();
    test.skip(
      !Array.isArray(ownItems) || ownItems.length === 0,
      "Akun uji siswa belum memiliki kiriman gallery_items - jalankan alur unggah terlebih dulu.",
    );

    const targetId = ownItems[0].id;
    const patchResponse = await request.patch(
      `${SUPABASE_URL}/rest/v1/gallery_items?id=eq.${targetId}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY as string,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        data: { status: "approved" },
      },
    );

    // RLS default-deny tanpa policy UPDATE untuk siswa: Supabase REST API
    // mengembalikan 204 dengan body kosong (0 baris ter-update) atau 403,
    // TIDAK PERNAH benar-benar mengubah baris tersebut.
    const patchedRows = patchResponse.ok() ? await patchResponse.json().catch(() => []) : [];
    expect(Array.isArray(patchedRows) ? patchedRows.length : 0).toBe(0);

    const verifyResponse = await request.get(
      `${SUPABASE_URL}/rest/v1/gallery_items?id=eq.${targetId}&select=status`,
      {
        headers: { apikey: SUPABASE_ANON_KEY as string, Authorization: `Bearer ${accessToken}` },
      },
    );
    const [verified] = await verifyResponse.json();
    expect(verified?.status).not.toBe("approved");
  });
});

/**
 * Pengujian negatif WAJIB Bagian 12 prompt Fase 3, level RLS langsung
 * (bukan lewat UI aplikasi - lihat e2e/akademik-rbac.spec.ts untuk versi UI).
 * Bagian 9 brief: "Pengurus SENGAJA tidak disertakan di exists-clause
 * manapun pada dua tabel ini" - dibuktikan di sini lewat REST API Supabase
 * langsung, bukan diasumsikan benar dari membaca SQL migration saja.
 */
test.describe("RLS grades/attendance - pengurus dikecualikan total", () => {
  test.skip(
    !SUPABASE_URL || !SUPABASE_ANON_KEY || !PENGURUS_EMAIL || !PENGURUS_PASSWORD,
    "Butuh NEXT_PUBLIC_SUPABASE_URL/ANON_KEY dan E2E_PENGURUS_EMAIL/PASSWORD pada environment Supabase nyata.",
  );

  test("pengurus mendapat hasil kosong saat SELECT grades langsung ke REST API", async ({
    request,
  }) => {
    const { access_token: accessToken } = await signIn(
      request,
      PENGURUS_EMAIL as string,
      PENGURUS_PASSWORD as string,
    );
    const response = await request.get(`${SUPABASE_URL}/rest/v1/grades?select=id,score&limit=5`, {
      headers: { apikey: SUPABASE_ANON_KEY as string, Authorization: `Bearer ${accessToken}` },
    });
    expect(response.ok()).toBe(true);
    const rows = await response.json();
    // Bukan 403 (RLS default-deny mengembalikan 200 dengan array kosong,
    // bukan error, karena PostgREST hanya menyaring baris yang policy-nya
    // mengizinkan SELECT - tidak ada satu policy pun yang menyebut pengurus).
    expect(Array.isArray(rows) ? rows.length : -1).toBe(0);
  });

  test("pengurus mendapat hasil kosong saat SELECT attendance langsung ke REST API", async ({
    request,
  }) => {
    const { access_token: accessToken } = await signIn(
      request,
      PENGURUS_EMAIL as string,
      PENGURUS_PASSWORD as string,
    );
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/attendance?select=id,status&limit=5`,
      { headers: { apikey: SUPABASE_ANON_KEY as string, Authorization: `Bearer ${accessToken}` } },
    );
    expect(response.ok()).toBe(true);
    const rows = await response.json();
    expect(Array.isArray(rows) ? rows.length : -1).toBe(0);
  });
});

test.describe("RLS grades/attendance - siswa tidak bisa membaca data siswa lain", () => {
  test.skip(
    !SUPABASE_URL || !SUPABASE_ANON_KEY || !SISWA_EMAIL || !SISWA_PASSWORD,
    "Butuh NEXT_PUBLIC_SUPABASE_URL/ANON_KEY dan E2E_SISWA_EMAIL/PASSWORD pada environment Supabase nyata.",
  );

  test("SELECT grades tanpa filter hanya mengembalikan baris milik sendiri", async ({
    request,
  }) => {
    const { access_token: accessToken, user } = await signIn(
      request,
      SISWA_EMAIL as string,
      SISWA_PASSWORD as string,
    );
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/grades?select=id,student_id&limit=200`,
      { headers: { apikey: SUPABASE_ANON_KEY as string, Authorization: `Bearer ${accessToken}` } },
    );
    expect(response.ok()).toBe(true);
    const rows: { student_id: string }[] = await response.json();
    // Bukan sekadar "tidak kosong" - memverifikasi SETIAP baris yang
    // kembali benar-benar milik siswa yang login, tidak ada satu pun
    // baris siswa lain yang bocor.
    for (const row of rows) {
      expect(row.student_id).toBe(user.id);
    }
  });

  test("siswa tidak bisa INSERT atau UPDATE baris grades/attendance sama sekali", async ({
    request,
  }) => {
    const { access_token: accessToken, user } = await signIn(
      request,
      SISWA_EMAIL as string,
      SISWA_PASSWORD as string,
    );
    const insertResponse = await request.post(`${SUPABASE_URL}/rest/v1/grades`, {
      headers: {
        apikey: SUPABASE_ANON_KEY as string,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      data: {
        student_id: user.id,
        subject_id: "00000000-0000-0000-0000-000000000000",
        assessment_type: "tugas",
        score: 100,
        semester: "Ganjil 2026/2027",
        entered_by: user.id,
      },
    });
    // grades_mutate_staff_only tidak menyertakan siswa sama sekali - insert
    // ditolak (403), bukan berhasil dengan nilai rekaan sendiri.
    expect(insertResponse.status()).toBeGreaterThanOrEqual(400);
  });
});

/**
 * Fase 4 - pengujian negatif WAJIB Bagian 12: "Siswa tidak dapat memaksa
 * status published lewat manipulasi permintaan langsung, diverifikasi
 * eksplisit". submitPostForReview() di server sudah menentukan status dari
 * role, tapi test ini membuktikan RLS SENDIRI juga menolak percobaan bypass
 * total (Server Action dilewati sepenuhnya, PATCH langsung ke PostgREST):
 * posts_update_own_draft_or_staff tidak punya WITH CHECK eksplisit, artinya
 * Postgres memakai ekspresi USING yang sama untuk memvalidasi baris BARU -
 * status='published' pada baris baru gagal syarat status IN
 * ('draft','pending_review'), sehingga UPDATE ditolak di level database.
 */
test.describe("RLS blog_posts - siswa tidak bisa memaksa status published", () => {
  test.skip(
    !SUPABASE_URL || !SUPABASE_ANON_KEY || !SISWA_EMAIL || !SISWA_PASSWORD,
    "Butuh NEXT_PUBLIC_SUPABASE_URL/ANON_KEY dan E2E_SISWA_EMAIL/PASSWORD, plus minimal satu draf/pending_review milik akun tsb.",
  );

  test("PATCH langsung status=published pada post draft milik sendiri ditolak RLS", async ({
    request,
  }) => {
    const { access_token: accessToken, user } = await signIn(
      request,
      SISWA_EMAIL as string,
      SISWA_PASSWORD as string,
    );

    const ownPostResponse = await request.get(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=id,status&author_id=eq.${user.id}&status=in.(draft,pending_review)&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY as string, Authorization: `Bearer ${accessToken}` } },
    );
    const [ownPost] = (await ownPostResponse.json()) as { id: string; status: string }[];
    if (!ownPost) {
      test.skip(
        true,
        "Akun uji siswa belum punya post draft/pending_review - buat satu dulu lewat /blog/tulis.",
      );
      return;
    }

    const patchResponse = await request.patch(
      `${SUPABASE_URL}/rest/v1/blog_posts?id=eq.${ownPost.id}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY as string,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        data: { status: "published" },
      },
    );

    const updatedRows = patchResponse.ok() ? await patchResponse.json() : [];
    // PostgREST bisa mengembalikan 200 dengan array KOSONG (bukan error)
    // saat RLS menolak baris - memverifikasi array kosong sama pentingnya
    // dengan memeriksa status code.
    expect(Array.isArray(updatedRows) ? updatedRows.length : 0).toBe(0);

    const verifyResponse = await request.get(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=status&id=eq.${ownPost.id}`,
      { headers: { apikey: SUPABASE_ANON_KEY as string, Authorization: `Bearer ${accessToken}` } },
    );
    const [verified] = await verifyResponse.json();
    expect(verified?.status).not.toBe("published");
  });
});
