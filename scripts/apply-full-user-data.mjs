import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const DEFAULT_AVATAR =
  "https://png.pngtree.com/png-vector/20250818/ourmid/pngtree-whatsapp-default-profile-photo-vector-png-image_17034397.webp";
const DEFAULT_PASSWORD = "Password123#";

const studentsData = [
  {
    absen: 1,
    name: "Pratama Aditya",
    gender: "L",
    role: "siswa",
    jabatan: null,
    email: "pratama.aditya@12rpl.com",
  },
  {
    absen: 2,
    name: "Putri Adina Rahayu",
    gender: "P",
    role: "siswa",
    jabatan: null,
    email: "putri.adina.rahayu@12rpl.com",
  },
  {
    absen: 3,
    name: "Qori'Ah Nur Hidayah",
    gender: "P",
    role: "pengurus",
    jabatan: "Sekretaris 2",
    email: "qoriah.nur.hidayah@12rpl.com",
  },
  {
    absen: 4,
    name: "Raditya Firmansyah",
    gender: "L",
    role: "siswa",
    jabatan: null,
    email: "raditya.firmansyah@12rpl.com",
  },
  {
    absen: 5,
    name: "Rahmat Fitriyono",
    gender: "L",
    role: "siswa",
    jabatan: null,
    email: "rahmat.fitriyono@12rpl.com",
  },
  {
    absen: 6,
    name: "Revinda Alfathunnisa",
    gender: "P",
    role: "siswa",
    jabatan: null,
    email: "revinda.alfathunnisa@12rpl.com",
  },
  {
    absen: 7,
    name: "Reza Adila",
    gender: "P",
    role: "siswa",
    jabatan: null,
    email: "reza.adila@12rpl.com",
  },
  {
    absen: 8,
    name: "Rian Radiansyah",
    gender: "L",
    role: "siswa",
    jabatan: null,
    email: "rian.radiansyah@12rpl.com",
  },
  {
    absen: 9,
    name: "Rikiyanto",
    gender: "L",
    role: "siswa",
    jabatan: null,
    email: "rikiyanto@12rpl.com",
  },
  {
    absen: 10,
    name: "Risa Amelia",
    gender: "P",
    role: "siswa",
    jabatan: null,
    email: "risa.amelia@12rpl.com",
  },
  {
    absen: 11,
    name: "Rivky Ramadhan",
    gender: "L",
    role: "siswa",
    jabatan: null,
    email: "rivky.ramadhan@12rpl.com",
  },
  {
    absen: 12,
    name: "Riyan Hidayatulloh",
    gender: "L",
    role: "siswa",
    jabatan: null,
    email: "riyan.hidayatulloh@12rpl.com",
  },
  {
    absen: 13,
    name: "Rosalina",
    gender: "P",
    role: "siswa",
    jabatan: null,
    email: "rosalina@12rpl.com",
  },
  {
    absen: 14,
    name: "Royana Ulfa Romandona Nur Sugiarto",
    gender: "P",
    role: "pengurus",
    jabatan: "Bendahara 2",
    email: "royana.ulfa@12rpl.com",
  },
  {
    absen: 15,
    name: "Samrotul Khasanah",
    gender: "P",
    role: "pengurus",
    jabatan: "Sekretaris 1",
    email: "samrotul.khasanah@12rpl.com",
  },
  {
    absen: 16,
    name: "Sandy Saputra",
    gender: "L",
    role: "siswa",
    jabatan: null,
    email: "sandy.saputra@12rpl.com",
  },
  {
    absen: 17,
    name: "Selviana",
    gender: "P",
    role: "siswa",
    jabatan: null,
    email: "selviana@12rpl.com",
  },
  {
    absen: 18,
    name: "Sifa Auliya",
    gender: "P",
    role: "pengurus",
    jabatan: "Bendahara 1",
    email: "sifa.auliya@12rpl.com",
  },
  {
    absen: 19,
    name: "Sifa Putri Rahayu",
    gender: "P",
    role: "siswa",
    jabatan: null,
    email: "sifa.putri.rahayu@12rpl.com",
  },
  {
    absen: 20,
    name: "Sintiya Wulandari",
    gender: "P",
    role: "siswa",
    jabatan: null,
    email: "sintiya.wulandari@12rpl.com",
  },
  {
    absen: 21,
    name: "Siti Fatimah",
    gender: "P",
    role: "siswa",
    jabatan: null,
    email: "siti.fatimah@12rpl.com",
  },
  {
    absen: 22,
    name: "Suci Rahmawati",
    gender: "P",
    role: "siswa",
    jabatan: null,
    email: "suci.rahmawati@12rpl.com",
  },
  {
    absen: 23,
    name: "Tabah Tri Hidayat",
    gender: "L",
    role: "siswa",
    jabatan: null,
    email: "tabah.tri.hidayat@12rpl.com",
  },
  { absen: 24, name: "Toha", gender: "L", role: "siswa", jabatan: null, email: "toha@12rpl.com" },
  {
    absen: 25,
    name: "Tri Kaniyawati",
    gender: "P",
    role: "siswa",
    jabatan: null,
    email: "tri.kaniyawati@12rpl.com",
  },
  {
    absen: 26,
    name: "Vanesa Putri Anjani",
    gender: "P",
    role: "siswa",
    jabatan: null,
    email: "vanesa.putri.anjani@12rpl.com",
  },
  {
    absen: 27,
    name: "Vidia Agustyani",
    gender: "P",
    role: "siswa",
    jabatan: null,
    email: "vidia.agustyani@12rpl.com",
  },
  {
    absen: 28,
    name: "Wahyu Andika Putra",
    gender: "L",
    role: "pengurus",
    jabatan: "Ketua Kelas",
    email: "wahyu.andika.putra@12rpl.com",
  },
  {
    absen: 29,
    name: "Wisnu Ady Kurniawan",
    gender: "L",
    role: "siswa",
    jabatan: null,
    email: "wisnu.ady.kurniawan@12rpl.com",
  },
  {
    absen: 30,
    name: "Zaeni Nur Abidin",
    gender: "L",
    role: "pengurus",
    jabatan: "Wakil Ketua",
    email: "zaeni.nur.abidin@12rpl.com",
  },
  {
    absen: 31,
    name: "Zazili Maulana",
    gender: "L",
    role: "siswa",
    jabatan: null,
    email: "zazili.maulana@12rpl.com",
  },
  {
    absen: 32,
    name: "Zidan Faisal Reza",
    gender: "L",
    role: "siswa",
    jabatan: null,
    email: "zidan.faisal.reza@12rpl.com",
  },
  {
    absen: 33,
    name: "Zidan Raif Pratama",
    gender: "L",
    role: "siswa",
    jabatan: null,
    email: "zidan.raif.pratama@12rpl.com",
  },
  {
    absen: 34,
    name: "Zulfa Nur Khabib",
    gender: "L",
    role: "siswa",
    jabatan: null,
    email: "zulfa.nur.khabib@12rpl.com",
  },
];

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const sql = postgres(process.env.SUPABASE_DB_URL);

  console.log("1. Mengambil user auth saat ini...");
  const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 100 });
  const authUsers = userList.users;
  console.log(`Ditemukan ${authUsers.length} akun auth.`);

  // Temukan super admin dan wali kelas
  const existingProfiles = await sql`SELECT * FROM profiles`;
  const superAdminProfile = existingProfiles.find((p) => p.role === "super_admin");
  const waliKelasProfile = existingProfiles.find((p) => p.role === "wali_kelas");

  console.log("Super admin ID:", superAdminProfile?.id);
  console.log("Wali kelas ID:", waliKelasProfile?.id);

  // 1. Update Super Admin
  if (superAdminProfile) {
    console.log("Mengupdate Super Admin...");
    await sql`
      UPDATE profiles
      SET full_name = 'Wahyu Andika Putra (Super Admin)',
          avatar_url = ${DEFAULT_AVATAR},
          jabatan = 'Administrator Sistem'
      WHERE id = ${superAdminProfile.id}
    `;
    // Update auth user
    await supabase.auth.admin.updateUserById(superAdminProfile.id, {
      email: "admin@12rpl.com",
      password: DEFAULT_PASSWORD,
      user_metadata: { full_name: "Wahyu Andika Putra (Super Admin)" },
      email_confirm: true,
    });
  }

  // 2. Update Wali Kelas
  if (waliKelasProfile) {
    console.log("Mengupdate Wali Kelas: Mintati S., Pd...");
    await sql`
      UPDATE profiles
      SET full_name = 'Mintati S., Pd',
          gender = 'P',
          avatar_url = ${DEFAULT_AVATAR},
          jabatan = 'Wali Kelas XII RPL 3',
          public_contact = '081234567890',
          is_public = true,
          slug = 'mintati-s-pd'
      WHERE id = ${waliKelasProfile.id}
    `;
    await supabase.auth.admin.updateUserById(waliKelasProfile.id, {
      email: "walikelas@12rpl.com",
      password: DEFAULT_PASSWORD,
      user_metadata: { full_name: "Mintati S., Pd" },
      email_confirm: true,
    });
  }

  // 3. Siswa (34 orang)
  // Ambil profil siswa lama (selain super admin & wali kelas) diurutkan berdasarkan absen
  const oldStudentProfiles = existingProfiles
    .filter((p) => p.id !== superAdminProfile?.id && p.id !== waliKelasProfile?.id)
    .sort((a, b) => (a.absen_number ?? 99) - (b.absen_number ?? 99));

  console.log(`Ada ${oldStudentProfiles.length} profil siswa lama.`);

  for (let i = 0; i < studentsData.length; i++) {
    const s = studentsData[i];
    const slug = slugify(s.name);
    const nis = `242512${String(s.absen).padStart(3, "0")}`;

    let targetProfileId = null;

    if (i < oldStudentProfiles.length) {
      // Reuse existing auth user and profile
      targetProfileId = oldStudentProfiles[i].id;
      console.log(`[${s.absen}] Memperbarui ${s.name} (ID: ${targetProfileId})...`);

      await supabase.auth.admin.updateUserById(targetProfileId, {
        email: s.email,
        password: DEFAULT_PASSWORD,
        user_metadata: { full_name: s.name },
        email_confirm: true,
      });

      await sql`
        UPDATE profiles
        SET full_name = ${s.name},
            nis = ${nis},
            absen_number = ${s.absen},
            role = ${s.role},
            jabatan = ${s.jabatan},
            gender = ${s.gender},
            slug = ${slug},
            avatar_url = ${DEFAULT_AVATAR},
            display_order = ${s.absen},
            is_public = true
        WHERE id = ${targetProfileId}
      `;
    } else {
      // Need to create new user (siswa ke-33 dan ke-34)
      console.log(`[${s.absen}] Membuat akun baru untuk ${s.name}...`);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: s.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: s.name },
      });

      if (createError) {
        console.error("Gagal buat user:", createError);
        continue;
      }

      targetProfileId = newUser.user.id;
      // Note: Trigger handle_new_auth_user might have created an initial profile row, let's upsert
      await sql`
        INSERT INTO profiles (id, full_name, nis, absen_number, role, jabatan, gender, slug, avatar_url, display_order, is_public)
        VALUES (${targetProfileId}, ${s.name}, ${nis}, ${s.absen}, ${s.role}, ${s.jabatan}, ${s.gender}, ${slug}, ${DEFAULT_AVATAR}, ${s.absen}, true)
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          nis = EXCLUDED.nis,
          absen_number = EXCLUDED.absen_number,
          role = EXCLUDED.role,
          jabatan = EXCLUDED.jabatan,
          gender = EXCLUDED.gender,
          slug = EXCLUDED.slug,
          avatar_url = EXCLUDED.avatar_url,
          display_order = EXCLUDED.display_order,
          is_public = true
      `;
    }
  }

  // 4. Update classProfile
  console.log("Memperbarui Class Profile...");
  await sql`
    UPDATE class_profile
    SET motto = 'Berkarya lewat kode, berkarakter lewat budaya.',
        sejarah = 'Kelas XII RPL 3 SMK Negeri 1 Sukoharjo merupakan wadah pembelajaran kejuruan rekayasa perangkat lunak berorientasi industri. Kami memadukan penguasaan teknologi web modern, arsitektur cloud, dan etika profesional untuk mencetak talenta digital berintegritas.',
        visi = 'Menjadi lulusan Rekayasa Perangkat Lunak yang unggul dalam kompetensi teknis, adaptif terhadap inovasi, dan berakhlak mulia.',
        misi = ${JSON.stringify([
          "Menguasai kompetensi rekayasa perangkat lunak berstandar industri nasional dan internasional.",
          "Menerapkan kedisiplinan, kolaborasi tim yang solid, dan integritas profesional.",
          "Menghasilkan karya teknologi nyata yang memberi dampak positif bagi masyarakat.",
        ])}::jsonb,
        tahun_ajaran = '2026/2027',
        updated_by = ${waliKelasProfile?.id ?? superAdminProfile?.id}
    WHERE id = 1
  `;

  console.log("\n--- SELESAI PEMBARUAN DATA ---");
  const finalProfiles = await sql`
    SELECT absen_number, full_name, role, jabatan, gender
    FROM profiles
    ORDER BY role, absen_number ASC NULLS LAST
  `;
  console.table(finalProfiles);

  await sql.end();
}

run().catch((err) => {
  console.error("Gagal:", err);
  process.exit(1);
});
