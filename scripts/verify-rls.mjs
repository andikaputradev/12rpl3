/**
 * Verifikasi RLS terhadap PostgreSQL nyata (PGlite, bukan mock) tanpa
 * membutuhkan kredensial Supabase. Menjalankan seluruh berkas migration di
 * drizzle/ secara berurutan pada instans Postgres sekali pakai, dengan shim
 * minimal untuk schema `auth` (auth.uid() via request.jwt.claim.sub, pola
 * identik implementasi Supabase asli), lalu menguji perilaku setiap policy
 * dengan peran anon/authenticated berbeda: penolakan yang seharusnya
 * ditolak, visibilitas yang seharusnya terbatas, dan integritas trigger.
 *
 * Ditambahkan sebagai aset permanen proyek (bukan skrip sekali pakai) sejak
 * verifikasi Fase 5 menemukan bug kritis: profiles_select_own_or_public_or_staff
 * dan profiles_update_own_or_staff (migration 0001) memuat subquery yang
 * meng-query profiles dari dalam policy profiles itu sendiri, menyebabkan
 * rekursi tak hingga (SQLSTATE 42P17) untuk setiap query authenticated yang
 * benar-benar menghormati RLS. Bug ini tidak pernah termanifestasi karena
 * RLS belum pernah dijalankan terhadap Postgres sungguhan pada fase manapun
 * (lihat drizzle/0013_fix_profiles_rls_recursion.sql untuk perbaikannya dan
 * penjelasan lengkap). Jalankan `pnpm db:verify-rls` setiap kali menambah
 * atau mengubah migration.
 *
 * Melengkapi, bukan menggantikan, e2e/rls-direct-api.spec.ts: skrip ini
 * memverifikasi LOGIKA policy dengan cepat tanpa kredensial (cocok untuk CI
 * dan sesi pengembangan lokal termasuk sandbox tanpa akses Supabase),
 * sedangkan spec Playwright tersebut menguji REST API Supabase yang benar-benar
 * ter-deploy secara end-to-end (butuh kredensial live).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const MIGRATIONS_DIR = fileURLToPath(new URL("../drizzle", import.meta.url));
const db = new PGlite();

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  [${detail}]` : ""}`);
}

async function as(role, uid, fn) {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid ?? ""]);
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}

async function attempt(fn) {
  try {
    const value = await fn();
    return { ok: true, value };
  } catch (error) {
    return { ok: false, code: error.code, message: String(error.message ?? error) };
  }
}

function expectOk(name, outcome, predicate = () => true) {
  const good = outcome.ok && predicate(outcome.value);
  record(name, good, outcome.ok ? "" : `${outcome.code}: ${outcome.message}`);
}

function expectDenied(name, outcome, codes) {
  const good = !outcome.ok && (!codes || codes.includes(outcome.code));
  record(name, good, outcome.ok ? "TIDAK ditolak" : `${outcome.code}: ${outcome.message}`);
}

const ids = {
  staff: "00000000-0000-0000-0000-0000000000a1",
  wali: "00000000-0000-0000-0000-0000000000a2",
  pengurus: "00000000-0000-0000-0000-0000000000a3",
  s1: "00000000-0000-0000-0000-0000000000b1",
  s2: "00000000-0000-0000-0000-0000000000b2",
  s3: "00000000-0000-0000-0000-0000000000b3",
};

async function runMigrations() {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text,
      raw_user_meta_data jsonb not null default '{}'::jsonb
    );
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  `);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => /^\d{4}_.*\.sql$/.test(name))
    .sort();

  for (const file of files) {
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const chunks = content.split("--> statement-breakpoint");
    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index].trim();
      if (!chunk) continue;
      try {
        await db.exec(chunk);
      } catch (error) {
        console.error(`GALAT migrasi ${file} potongan #${index}: ${error.message}`);
        process.exit(2);
      }
    }
  }
  record(`seluruh ${files.length} berkas migrasi (0000 sampai 0012) berjalan tanpa galat`, true);
}

async function seed() {
  await db.exec(`
    insert into auth.users (id, email, raw_user_meta_data) values
      ('${ids.staff}', 'staff@uji.test', '{"full_name":"Staf Uji"}'),
      ('${ids.wali}', 'wali@uji.test', '{"full_name":"Wali Uji"}'),
      ('${ids.pengurus}', 'pengurus@uji.test', '{"full_name":"Pengurus Uji"}'),
      ('${ids.s1}', 's1@uji.test', '{"full_name":"Siswa Satu"}'),
      ('${ids.s2}', 's2@uji.test', '{"full_name":"Siswa Dua"}'),
      ('${ids.s3}', 's3@uji.test', '{"full_name":"Siswa Tiga"}');
    update profiles set role = 'super_admin' where id = '${ids.staff}';
    update profiles set role = 'wali_kelas' where id = '${ids.wali}';
    update profiles set role = 'pengurus' where id = '${ids.pengurus}';

    insert into polls (id, question, allow_multiple_choice, created_by) values
      ('10000000-0000-0000-0000-000000000001', 'Polling terbuka single', false, '${ids.staff}'),
      ('10000000-0000-0000-0000-000000000002', 'Polling terbuka lain', false, '${ids.staff}'),
      ('10000000-0000-0000-0000-000000000003', 'Polling multi', true, '${ids.staff}');
    insert into polls (id, question, allow_multiple_choice, closes_at, created_by) values
      ('10000000-0000-0000-0000-000000000004', 'Polling tertutup', false, now() - interval '1 hour', '${ids.staff}');
    insert into poll_options (id, poll_id, label, display_order) values
      ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000001', 'A', 0),
      ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000001', 'B', 1),
      ('20000000-0000-0000-0000-00000000001a', '10000000-0000-0000-0000-000000000002', 'P2A', 0),
      ('20000000-0000-0000-0000-00000000002a', '10000000-0000-0000-0000-000000000003', 'MA', 0),
      ('20000000-0000-0000-0000-00000000002b', '10000000-0000-0000-0000-000000000003', 'MB', 1),
      ('20000000-0000-0000-0000-00000000003a', '10000000-0000-0000-0000-000000000004', 'CA', 0);
  `);
}

const POLL = {
  single: "10000000-0000-0000-0000-000000000001",
  other: "10000000-0000-0000-0000-000000000002",
  multi: "10000000-0000-0000-0000-000000000003",
  closed: "10000000-0000-0000-0000-000000000004",
};
const OPT = {
  a: "20000000-0000-0000-0000-00000000000a",
  b: "20000000-0000-0000-0000-00000000000b",
  p2a: "20000000-0000-0000-0000-00000000001a",
  ma: "20000000-0000-0000-0000-00000000002a",
  mb: "20000000-0000-0000-0000-00000000002b",
  ca: "20000000-0000-0000-0000-00000000003a",
};

const RLS = ["42501"];

async function testGuestbook() {
  const insertGuestbook = (status, extra = {}) => {
    const cols = { name: "Pengunjung", message: "Halo kelas RPL", status, ...extra };
    const keys = Object.keys(cols);
    return db.query(
      `insert into guestbook_entries (${keys.join(",")}) values (${keys.map((_, i) => `$${i + 1}`).join(",")})`,
      Object.values(cols),
    );
  };

  expectOk(
    "buku tamu: anon boleh insert status pending_review",
    await attempt(() => as("anon", null, () => insertGuestbook("pending_review"))),
  );
  expectDenied(
    "buku tamu: anon TIDAK boleh menyetel status=approved sendiri (self-approve)",
    await attempt(() => as("anon", null, () => insertGuestbook("approved"))),
    RLS,
  );
  expectDenied(
    "buku tamu: anon TIDAK boleh menyetel moderated_by",
    await attempt(() =>
      as("anon", null, () => insertGuestbook("pending_review", { moderated_by: ids.staff })),
    ),
    RLS,
  );
  expectDenied(
    "buku tamu: anon TIDAK boleh memalsukan author_id milik siswa lain",
    await attempt(() =>
      as("anon", null, () => insertGuestbook("pending_review", { author_id: ids.s1 })),
    ),
    RLS,
  );
  expectDenied(
    "buku tamu: pesan terlalu pendek (4 karakter) ditolak",
    await attempt(() =>
      as("anon", null, () => insertGuestbook("pending_review", { message: "abcd" })),
    ),
    RLS,
  );
  expectDenied(
    "buku tamu: nama terlalu panjang (81 karakter) ditolak",
    await attempt(() =>
      as("anon", null, () => insertGuestbook("pending_review", { name: "x".repeat(81) })),
    ),
    RLS,
  );
  expectOk(
    "buku tamu: pengguna login boleh mengisi author_id miliknya sendiri",
    await attempt(() =>
      as("authenticated", ids.s1, () => insertGuestbook("pending_review", { author_id: ids.s1 })),
    ),
  );
  expectDenied(
    "buku tamu: pengguna login TIDAK boleh mengisi author_id orang lain",
    await attempt(() =>
      as("authenticated", ids.s1, () => insertGuestbook("pending_review", { author_id: ids.s2 })),
    ),
    RLS,
  );

  const pendingVisible = await attempt(() =>
    as("anon", null, () => db.query("select id from guestbook_entries")),
  );
  expectOk(
    "buku tamu: anon tidak melihat baris pending_review",
    pendingVisible,
    (r) => r.rows.length === 0,
  );

  await db.exec(
    `insert into guestbook_entries (name, message, status) values ('Disetujui', 'Pesan sudah disetujui', 'approved')`,
  );
  const approvedVisible = await attempt(() =>
    as("anon", null, () =>
      db.query(
        "select id, name, message, created_at from guestbook_entries where status = 'approved'",
      ),
    ),
  );
  expectOk(
    "buku tamu: anon melihat baris approved (kolom publik)",
    approvedVisible,
    (r) => r.rows.length === 1,
  );

  expectDenied(
    "buku tamu: anon TIDAK dapat membaca kolom author_id (hak kolom)",
    await attempt(() =>
      as("anon", null, () => db.query("select author_id from guestbook_entries")),
    ),
    RLS,
  );

  const anonUpdate = await attempt(() =>
    as("anon", null, () =>
      db.query("update guestbook_entries set status = 'approved' where status = 'pending_review'"),
    ),
  );
  record(
    "buku tamu: anon TIDAK dapat mengubah status (ditolak atau 0 baris)",
    !anonUpdate.ok || anonUpdate.value.affectedRows === 0,
    anonUpdate.ok ? `affectedRows=${anonUpdate.value.affectedRows}` : anonUpdate.code,
  );

  const staffUpdate = await attempt(() =>
    as("authenticated", ids.staff, () =>
      db.query(
        "update guestbook_entries set status = 'approved', moderated_by = $1 where status = 'pending_review'",
        [ids.staff],
      ),
    ),
  );
  expectOk("buku tamu: staf dapat menyetujui entri", staffUpdate, (r) => r.affectedRows >= 1);

  const serverInsert = await attempt(() =>
    db.query(
      "insert into guestbook_entries (name, message, status, author_id) values ('Server', 'Lewat koneksi db langsung', 'pending_review', $1)",
      [ids.s1],
    ),
  );
  expectOk(
    "jalur server (koneksi langsung, bypass RLS) tetap dapat menulis author_id",
    serverInsert,
  );
  const serverRead = await attempt(() =>
    db.query("select author_id from guestbook_entries where author_id is not null limit 1"),
  );
  expectOk("jalur server tetap dapat membaca author_id", serverRead, (r) => r.rows.length === 1);
}

async function testAspirations() {
  const insertAspiration = (uid, status, isAnonymous, extra = {}) => {
    const cols = {
      content: "Aspirasi uji yang cukup panjang",
      is_anonymous: isAnonymous,
      author_id: uid,
      status,
      ...extra,
    };
    const keys = Object.keys(cols);
    return db.query(
      `insert into aspirations (${keys.join(",")}) values (${keys.map((_, i) => `$${i + 1}`).join(",")})`,
      Object.values(cols),
    );
  };

  expectDenied(
    "aspirasi: siswa TIDAK boleh self-approve aspirasi ANONIM (status=approved, is_anonymous=true)",
    await attempt(() =>
      as("authenticated", ids.s1, () => insertAspiration(ids.s1, "approved", true)),
    ),
    RLS,
  );
  expectOk(
    "aspirasi: aspirasi anonim boleh masuk sebagai pending_review",
    await attempt(() =>
      as("authenticated", ids.s1, () => insertAspiration(ids.s1, "pending_review", true)),
    ),
  );
  expectOk(
    "aspirasi: aspirasi NON-anonim boleh langsung approved (Asumsi Kunci #3)",
    await attempt(() =>
      as("authenticated", ids.s1, () => insertAspiration(ids.s1, "approved", false)),
    ),
  );
  expectDenied(
    "aspirasi: author_id orang lain ditolak",
    await attempt(() =>
      as("authenticated", ids.s1, () => insertAspiration(ids.s2, "pending_review", false)),
    ),
    RLS,
  );
  expectDenied(
    "aspirasi: moderated_by tidak boleh diisi pengirim",
    await attempt(() =>
      as("authenticated", ids.s1, () =>
        insertAspiration(ids.s1, "pending_review", false, { moderated_by: ids.staff }),
      ),
    ),
    RLS,
  );
  expectDenied(
    "aspirasi: konten pendek (9 karakter) ditolak",
    await attempt(() =>
      as("authenticated", ids.s1, () =>
        insertAspiration(ids.s1, "pending_review", false, { content: "123456789" }),
      ),
    ),
    RLS,
  );

  const anonRead = await attempt(() =>
    as("anon", null, () => db.query("select id from aspirations")),
  );
  record(
    "aspirasi: anon tidak dapat membaca aspirasi sama sekali (ditolak atau 0 baris)",
    !anonRead.ok || anonRead.value.rows.length === 0,
    anonRead.ok ? `rows=${anonRead.value.rows.length}` : anonRead.code,
  );

  const s2Read = await attempt(() =>
    as("authenticated", ids.s2, () => db.query("select id, content, status from aspirations")),
  );
  expectOk(
    "aspirasi: siswa lain hanya melihat baris approved (tidak melihat pending milik s1)",
    s2Read,
    (r) => r.rows.length === 1 && r.rows[0].status === "approved",
  );
  const s1Read = await attempt(() =>
    as("authenticated", ids.s1, () => db.query("select id, status from aspirations")),
  );
  expectOk(
    "aspirasi: pengirim melihat baris pending miliknya sendiri (RLS memakai author_id walau kolomnya tertutup)",
    s1Read,
    (r) => r.rows.length === 2,
  );
  expectDenied(
    "aspirasi: siswa lain TIDAK dapat membaca author_id pengirim anonim lewat REST (hak kolom)",
    await attempt(() =>
      as("authenticated", ids.s2, () => db.query("select author_id from aspirations")),
    ),
    RLS,
  );
  expectDenied(
    "aspirasi: select * ditolak karena mencakup kolom tertutup",
    await attempt(() => as("authenticated", ids.s2, () => db.query("select * from aspirations"))),
    RLS,
  );

  const staffUpdate = await attempt(() =>
    as("authenticated", ids.staff, () =>
      db.query(
        "update aspirations set status = 'approved', moderated_by = $1 where status = 'pending_review'",
        [ids.staff],
      ),
    ),
  );
  expectOk("aspirasi: staf dapat menyetujui", staffUpdate, (r) => r.affectedRows === 1);
  const studentUpdate = await attempt(() =>
    as("authenticated", ids.s1, () =>
      db.query("update aspirations set status = 'approved' where author_id = $1", [ids.s1]),
    ),
  );
  record(
    "aspirasi: siswa TIDAK dapat mengubah status miliknya (ditolak atau 0 baris)",
    !studentUpdate.ok || studentUpdate.value.affectedRows === 0,
    studentUpdate.ok ? `affectedRows=${studentUpdate.value.affectedRows}` : studentUpdate.code,
  );
}

async function testPesanKesan() {
  const insertPesan = (from, to, status, isAnonymous, extra = {}) => {
    const cols = {
      from_student_id: from,
      to_student_id: to,
      message: "Terima kasih atas kebersamaannya",
      is_anonymous: isAnonymous,
      status,
      ...extra,
    };
    const keys = Object.keys(cols);
    return db.query(
      `insert into pesan_kesan (${keys.join(",")}) values (${keys.map((_, i) => `$${i + 1}`).join(",")})`,
      Object.values(cols),
    );
  };

  expectDenied(
    "pesan-kesan: TIDAK boleh self-approve pesan ANONIM",
    await attempt(() =>
      as("authenticated", ids.s1, () => insertPesan(ids.s1, ids.s2, "approved", true)),
    ),
    RLS,
  );
  expectDenied(
    "pesan-kesan: TIDAK boleh mengirim ke diri sendiri",
    await attempt(() =>
      as("authenticated", ids.s1, () => insertPesan(ids.s1, ids.s1, "pending_review", false)),
    ),
    RLS,
  );
  expectDenied(
    "pesan-kesan: from_student_id orang lain (pemalsuan pengirim) ditolak",
    await attempt(() =>
      as("authenticated", ids.s1, () => insertPesan(ids.s3, ids.s2, "pending_review", false)),
    ),
    RLS,
  );
  expectOk(
    "pesan-kesan: pesan anonim boleh masuk sebagai pending_review",
    await attempt(() =>
      as("authenticated", ids.s1, () => insertPesan(ids.s1, ids.s2, "pending_review", true)),
    ),
  );

  const recipient = await attempt(() =>
    as("authenticated", ids.s2, () => db.query("select id, message, status from pesan_kesan")),
  );
  expectOk(
    "pesan-kesan: penerima melihat pesan pending untuknya",
    recipient,
    (r) => r.rows.length === 1 && r.rows[0].status === "pending_review",
  );

  const stranger = await attempt(() =>
    as("authenticated", ids.s3, () => db.query("select id from pesan_kesan")),
  );
  expectOk(
    "pesan-kesan: siswa lain (bukan penerima/pengirim) TIDAK melihat pesan pending",
    stranger,
    (r) => r.rows.length === 0,
  );

  const anon = await attempt(() => as("anon", null, () => db.query("select id from pesan_kesan")));
  expectOk(
    "pesan-kesan: publik (anon) belum melihat pesan pending",
    anon,
    (r) => r.rows.length === 0,
  );

  expectDenied(
    "pesan-kesan: penerima TIDAK dapat membaca from_student_id pengirim anonim lewat REST (hak kolom)",
    await attempt(() =>
      as("authenticated", ids.s2, () => db.query("select from_student_id from pesan_kesan")),
    ),
    RLS,
  );
  expectDenied(
    "pesan-kesan: anon TIDAK dapat membaca from_student_id (hak kolom)",
    await attempt(() =>
      as("anon", null, () => db.query("select from_student_id from pesan_kesan")),
    ),
    RLS,
  );

  const staffApprove = await attempt(() =>
    as("authenticated", ids.pengurus, () =>
      db.query(
        "update pesan_kesan set status = 'approved', moderated_by = $1 where to_student_id = $2",
        [ids.pengurus, ids.s2],
      ),
    ),
  );
  expectOk(
    "pesan-kesan: pengurus dapat menyetujui (moderasi tiga-role)",
    staffApprove,
    (r) => r.affectedRows === 1,
  );

  const anonAfter = await attempt(() =>
    as("anon", null, () =>
      db.query("select id, to_student_id, message, is_anonymous from pesan_kesan"),
    ),
  );
  expectOk(
    "pesan-kesan: setelah disetujui, publik melihat baris (kolom publik saja)",
    anonAfter,
    (r) => r.rows.length === 1,
  );
}

async function testPolls() {
  const vote = (uid, pollId, optionId) =>
    db.query("insert into poll_votes (poll_id, option_id, voter_id) values ($1, $2, $3)", [
      pollId,
      optionId,
      uid,
    ]);

  expectOk(
    "polling: siswa memilih opsi valid pada polling terbuka",
    await attempt(() => as("authenticated", ids.s1, () => vote(ids.s1, POLL.single, OPT.a))),
  );
  expectDenied(
    "polling: TIDAK bisa memilih opsi kedua pada polling single-choice (PV001)",
    await attempt(() => as("authenticated", ids.s1, () => vote(ids.s1, POLL.single, OPT.b))),
    ["PV001"],
  );
  expectDenied(
    "polling: memilih ulang opsi yang sama ditolak (PV001 oleh trigger)",
    await attempt(() => as("authenticated", ids.s1, () => vote(ids.s1, POLL.single, OPT.a))),
    ["PV001", "23505"],
  );
  expectDenied(
    "polling: memilih pada polling tertutup ditolak (PV002)",
    await attempt(() => as("authenticated", ids.s2, () => vote(ids.s2, POLL.closed, OPT.ca))),
    ["PV002"],
  );
  expectDenied(
    "polling: opsi milik polling lain ditolak (PV003)",
    await attempt(() => as("authenticated", ids.s2, () => vote(ids.s2, POLL.single, OPT.p2a))),
    ["PV003"],
  );
  expectDenied(
    "polling: memalsukan voter_id orang lain ditolak RLS",
    await attempt(() => as("authenticated", ids.s2, () => vote(ids.s1, POLL.other, OPT.p2a))),
    RLS,
  );

  const bulk = await attempt(() =>
    as("authenticated", ids.s3, () =>
      db.query(
        "insert into poll_votes (poll_id, option_id, voter_id) values ($1,$2,$3),($1,$4,$3)",
        [POLL.single, OPT.a, ids.s3, OPT.b],
      ),
    ),
  );
  expectDenied("polling: bulk insert dua opsi sekaligus pada single-choice ditolak (PV001)", bulk, [
    "PV001",
  ]);
  const afterBulk = await db.query(
    "select count(*)::int as n from poll_votes where voter_id = $1",
    [ids.s3],
  );
  record(
    "polling: bulk insert yang gagal tidak meninggalkan baris parsial",
    afterBulk.rows[0].n === 0,
    `baris=${afterBulk.rows[0].n}`,
  );

  expectOk(
    "polling multi-choice: dua opsi berbeda dalam satu pengiriman diterima",
    await attempt(() =>
      as("authenticated", ids.s1, () =>
        db.query(
          "insert into poll_votes (poll_id, option_id, voter_id) values ($1,$2,$3),($1,$4,$3)",
          [POLL.multi, OPT.ma, ids.s1, OPT.mb],
        ),
      ),
    ),
  );
  expectDenied(
    "polling multi-choice: opsi yang sama dua kali ditolak (unique)",
    await attempt(() => as("authenticated", ids.s1, () => vote(ids.s1, POLL.multi, OPT.ma))),
    ["23505"],
  );

  const s2Raw = await attempt(() =>
    as("authenticated", ids.s2, () => db.query("select * from poll_votes")),
  );
  expectOk(
    "polling: baris suara mentah milik siswa lain TIDAK terlihat (bilik suara rahasia)",
    s2Raw,
    (r) => r.rows.length === 0,
  );
  const s1Raw = await attempt(() =>
    as("authenticated", ids.s1, () => db.query("select * from poll_votes")),
  );
  expectOk("polling: pemilik melihat suaranya sendiri", s1Raw, (r) => r.rows.length === 3);
  const anonRaw = await attempt(() => as("anon", null, () => db.query("select * from poll_votes")));
  record(
    "polling: anon tidak melihat baris suara mentah (ditolak atau 0 baris)",
    !anonRaw.ok || anonRaw.value.rows.length === 0,
    anonRaw.ok ? `rows=${anonRaw.value.rows.length}` : anonRaw.code,
  );
  const staffRaw = await attempt(() =>
    as("authenticated", ids.staff, () => db.query("select * from poll_votes")),
  );
  expectOk("polling: staf dapat melihat baris suara mentah", staffRaw, (r) => r.rows.length === 3);

  const aggregate = await attempt(() =>
    as("anon", null, () =>
      db.query("select option_id, vote_count from get_poll_results($1)", [POLL.single]),
    ),
  );
  expectOk(
    "polling: anon memperoleh agregat lewat get_poll_results (SECURITY DEFINER), tanpa akses baris mentah",
    aggregate,
    (r) => r.rows.length === 1 && Number(r.rows[0].vote_count) === 1,
  );

  expectDenied(
    "polling: siswa TIDAK dapat membuat polling",
    await attempt(() =>
      as("authenticated", ids.s1, () =>
        db.query("insert into polls (question, created_by) values ('Coba', $1)", [ids.s1]),
      ),
    ),
    RLS,
  );
  expectOk(
    "polling: staf dapat membuat polling",
    await attempt(() =>
      as("authenticated", ids.staff, () =>
        db.query("insert into polls (question, created_by) values ('Polling staf', $1)", [
          ids.staff,
        ]),
      ),
    ),
  );
  expectOk(
    "polling: anon dapat membaca daftar polling dan opsi (publik)",
    await attempt(() =>
      as("anon", null, () =>
        db.query("select p.id, o.label from polls p join poll_options o on o.poll_id = p.id"),
      ),
    ),
    (r) => r.rows.length >= 4,
  );
}

async function testKelulusanContent() {
  const anon = await attempt(() =>
    as("anon", null, () => db.query("select id, intro_text from kelulusan_content")),
  );
  expectOk(
    "kelulusan_content: anon dapat membaca baris singleton hasil seed",
    anon,
    (r) => r.rows.length === 1,
  );

  for (const [label, uid, expected] of [
    ["siswa", ids.s1, 0],
    ["pengurus", ids.pengurus, 0],
    ["wali_kelas", ids.wali, 1],
    ["super_admin", ids.staff, 1],
  ]) {
    const outcome = await attempt(() =>
      as("authenticated", uid, () =>
        db.query("update kelulusan_content set intro_text = 'uji' where id = 1"),
      ),
    );
    record(
      `kelulusan_content: ${label} update -> ${expected} baris (pengurus dikecualikan, sama seperti class_profile)`,
      outcome.ok && outcome.value.affectedRows === expected,
      outcome.ok
        ? `affectedRows=${outcome.value.affectedRows}`
        : `${outcome.code}: ${outcome.message}`,
    );
  }
}

async function testDefaultDeny() {
  const tables = [
    "guestbook_entries",
    "aspirations",
    "polls",
    "poll_options",
    "poll_votes",
    "pesan_kesan",
    "kelulusan_content",
  ];
  const rows = await db.query(
    "select relname, relrowsecurity, relforcerowsecurity from pg_class where relname = any($1) and relkind = 'r' order by relname",
    [tables],
  );
  const all =
    rows.rows.length === tables.length &&
    rows.rows.every((r) => r.relrowsecurity && r.relforcerowsecurity);
  record(
    "ke-7 tabel Fase 5 memiliki ENABLE dan FORCE row level security",
    all,
    rows.rows.map((r) => `${r.relname}:${r.relrowsecurity}/${r.relforcerowsecurity}`).join(" "),
  );
}

await runMigrations();
await seed();
await testDefaultDeny();
await testGuestbook();
await testAspirations();
await testPesanKesan();
await testPolls();
await testKelulusanContent();

const failed = results.filter((r) => !r.ok);
console.log(
  `\nRINGKASAN: ${results.length - failed.length}/${results.length} lulus, ${failed.length} gagal`,
);
if (failed.length > 0) {
  console.log("GAGAL:");
  for (const item of failed) console.log(` - ${item.name} [${item.detail}]`);
  process.exit(1);
}
